export default function bisect({
  background,
  effect,
  expiry = Number.MAX_SAFE_INTEGER,
}) {
  return (...args) => {
    let promise = background(...args);
    const time = Date.now();

    return () => {
      // if expired fetch again
      if (expiry !== undefined || Date.now() - time > expiry) {
        promise = background(...args);
      }

      return promise.then(effect);
    };
  };
}
