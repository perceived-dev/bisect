# bisect

Bisect your async task into two steps, first perform async work in background and then apply the effect of work.

For example while you are fetching some data and updating view with new data. You can break task in following to improve perceived experience.

1. fetch the data (background work)
2. Apply the new data on your view (effect of work)

This is more of a pattern than a library. Library is pretty small.

## usage

```js
const start = bisect({
  background(...args) {
    // Async work which happens on background and does not have any effect on view or state. like just making fetch call
    // This method should return a promise.
    return fetch(url);
  },
  effect(data) {
    // this is where the effect from the async work is applied. For example you want to update view or state based on api response.
    updateView(data);
  },
  // Thresold to expire/discard background work by async task if it is not applied before a expiry period.
  // Default to Math.MAX_SAFE_INTEGER (never expire)
  expiry: 1000,
});
```

Then you can use it like

```js
let apply;

// this could be anything, not necessarily mouseenter on button
button.addEventListener("mouseenter", () => {
  apply = start(someParam);
});

button.addEventListener("click", () => {
  apply();
});
```

## Why bisect my async task?

Lets understand with an example. Let's say on an ecommorce site you have the product list. On click of a product you load data and show the detail on side drawer.

A very basic implementation would look something like this.

```js
function showProductDetail(productId) {
  return fetch(`/product/details/${productId}`)
    .then((response) => response.json())
    .then((data) => {
      const productDetail = formatData(data);
      openProductDetailDrawer(productDetail);
    });
}
```

Ignore the race conditions that can happen on this. In this we are just focusing on fetching a data and displaying them on a view.

Now on a basic flow, the User Interaction and Code Flow would be something like this.

- User clicks on product.
- You display a loader.
- You call showProductDetail method with that product id.
- The method fetches the data and once available it shows the data on the view.
- You clear the loader.

Let's say API takes 1s to load the data and openProductDetailDrawer takes 50ms to show it in the view.
So when user clicks a product it takes 1050ms for a user to present the result. Lets call that a waiting time of 1050ms.

We can definetly improve this experience. If we start loading the data before hand lets say when user hovers over the card. We can
reduce the overall waiting time as the waiting time starts after user clicks the product, and we have started loading it before hand.

But we can't just call showProductDetail on hover, as we can just predict the user intention but we are not sure if they will actully click it.

But, we can break this task into two parts.

1. Fetch the product detail when user hovers on the product. (Just the fetch, which doesn't have any effect on view).
2. Apply the data (call openProductDetailDrawer) on view only when user clicks.

Let's refactor this code into this two methods.

```js
function fetchProductDetail(productId) {
  return fetch(`/product/details/${productId}`).then((response) =>
    response.json()
  );
}

function showProductDetail(data) {
  const productDetail = formatData(data);
  openProductDetailDrawer(productDetail);
}
```

Then we can call the fetchProductDetail on hover and call showProductDetail on click with the response data of fetch. The usage may look something like this.

```js
let fetchPromise;

card.addEventListener("mouseenter", () => {
  fetchPromise = fetchProductDetail(productId);
});

card.addEventListener("click", () => {
  fetchPromise.then(showProductDetail);
});
```

There might be some other cases like discard promise if it happened before a threshold time.
Bisect provides a small util for writing it in cleaner way.

```js
const showProductDetail = bisect({
  background(producdId) {
    return fetch(`/product/details/${productId}`).then((response) =>
      response.json()
    );
  },
  effect(data) {
    const productDetail = formatData(data);
    openProductDetailDrawer(productDetail);
  },
  expiry: 3000, // default to never expire
});
```

```js
let applyTask;

card.addEventListener("mouseenter", () => {
  applyTask = showProductDetail(productId);
});

card.addEventListener("click", () => {
  applyTask();
});
```
