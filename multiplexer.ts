import { Readable, Writable } from "stream";

class Channel<W, R = W> {
  public listeners = new Set<(data: R) => void>();
  constructor(private mux: Multiplexer<W, R>, private id: number) {}

  write(data: W) {
    return this.mux.writeChannel(this.id, data);
  }

  notify(data: R) {
    this.listeners.forEach((listener) => listener(data));
  }

  close() {
    this.mux.closeChannel(this.id);
  }
}

type MultiplexerMessage<T> =
  | { action: "transfer-data"; channelId: number; data: T }
  | { action: "open-channel"; channelId: number }
  | { action: "close-channel"; channelId: number };
export class Multiplexer<W, R = W> {
  private channels: { [id: number]: Channel<W, R> } = {};
  private nextChannelId: number = 0;

  public onChannelOpenListeners = new Set<(channel: Channel<W, R>) => void>();

  constructor(private inStream: Readable, private outStream: Writable) {
    this.handleRead = this.handleRead.bind(this);

    this.inStream.on("data", this.handleRead);
  }

  private processMessage(msg: MultiplexerMessage<R>) {
    if (msg.action === "transfer-data") {
      if (!(msg.channelId in this.channels)) {
        throw new Error(
          `cannot transfer data: channel ${msg.channelId} does not exist`
        );
      }

      this.channels[msg.channelId].notify(msg.data);
    }

    if (msg.action === "open-channel") {
      if (msg.channelId in this.channels) {
        throw new Error(
          `cannot open channel: channel ${msg.channelId} already exists`
        );
      }
      const channel = new Channel(this, msg.channelId);
      this.channels[msg.channelId] = channel;
      this.nextChannelId = msg.channelId + 1;
      this.onChannelOpenListeners.forEach((cb) => cb(channel));
    }

    if (msg.action === "close-channel") {
      if (!(msg.channelId in this.channels)) {
        throw new Error(
          `cannot delete channel: channel ${msg.channelId} does not exist`
        );
      }

      delete this.channels[msg.channelId];
    }
  }

  private readBuffer = "";
  private handleRead(chunk: string) {
    this.readBuffer += chunk;

    const lines = this.readBuffer.split("\n");
    lines.forEach((line) => {
      let msg: MultiplexerMessage<R>;
      try {
        msg = JSON.parse(line);
      } catch {
        return;
      }
      this.processMessage(msg);
    });
  }

  private async write(data: MultiplexerMessage<W>) {
    return new Promise((resolve, reject) =>
      this.outStream.write(JSON.stringify(data), (error) =>
        error ? reject(error) : resolve()
      )
    );
  }

  public createChannel(channelId = this.nextChannelId++) {
    const channel = new Channel(this, channelId);
    this.channels[channelId] = channel;
    this.write({ action: "open-channel", channelId });
    return channel;
  }

  public closeChannel(channelId: number) {
    delete this.channels[channelId];
    this.write({ action: "close-channel", channelId });
  }

  public writeChannel(channelId: number, data: W) {
    return this.write({ action: "transfer-data", channelId, data });
  }

  public request(data: W): Promise<R> {
    const channel = this.createChannel();
    channel.write(data);
    return new Promise((resolve) => {
      const listener = (data: R) => {
        channel.listeners.delete(listener);
        channel.close();
        resolve(data);
      };
      channel.listeners.add(listener);
    });
  }
}
