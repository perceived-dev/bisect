export default function bisect({fetch, action, expiry}) {
  return () => {
    let promise, timeout;

    const module = {
      clear() {
        promise = null;
        clearTimeout(timeout);
      },
      start(...args) {
        if (!promise) {
          promise = Promise.resolve(fetch(...args));

          if (expiry) {
            clearTimeout(timeout);
            timeout = setTimeout(module.clear, expiry);
          }
        }

        return promise;
      }
      finish(...args) {
        return module.start(...args).then((data) => action(data, ...args));
      }
    }
  }
}

