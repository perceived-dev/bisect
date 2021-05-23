export default function bisect({ task, action, expiry = Number.MAX_SAFE_INTEGER }) {
  return (...args) => {
    let promise = task(...args);
    const time = Date.now();

    return () => {
      // if expired fetch again
      if (expiry !== undefined || Date.now() - time > expiry) promise = task(...args);

      return promise.then(action);
    }
  }
}
