# Oath
 A naive implementation of the JavaScript Promise API

### Usage
 It's the same as the native Promise implementation. Here are code samples:

 ```
  const promise = Promise.resolve(10);
  promise.then(console.log); // logs 10 to the console

  function sleep(length) {
    return new Promise((resolve, reject) => {
    	setTimeout(() => resolve(), length);
    });
  }

  sleep(1000)
  	.then(() => console.log('I have slept for 1000 milliseconds'));
 ```

 Oaths and Promises can be used to replace each other at any point. This is due to the fact that they both implement the same interface.

 ```
  Promise.all([Oath.resolve(10), Promise.resolve(20)])
  	.then(console.log); // logs [10, 20] to the console
 ```

### Bugs
 I've fixed the ones I found locally. I haven't done thorough tests on it yet, but it works just fine. If you spot any, I'm open for pull requests!