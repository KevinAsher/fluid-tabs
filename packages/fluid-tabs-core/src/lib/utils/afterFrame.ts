// Port of https://github.com/andrewiggins/afterframe

let callback: (() => void) | null = null;

let channel: MessageChannel | null = new MessageChannel();

const postMessage = function (this: MessagePort) {
  this.postMessage(undefined);
}.bind(channel.port2);

// Flush the callback queue when a message is posted to the message channel
channel.port1.onmessage = () => {
  callback?.();
};

// If the onmessage handler closes over the MessageChannel, the MessageChannel never gets GC'd:
channel = null;

export default function afterFrame(cb: () => void) {
  callback = cb;
  requestAnimationFrame(postMessage);
}
