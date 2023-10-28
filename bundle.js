(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
const vader = require("vader-sentiment");
const Rx = require("rxjs");
const patterns = [
  /(?:^|\s)(?:[A-Z][a-z]*)(?:\s|$)/g,
  /function\s+[\w$]+\s*\([^)]*\)|\w+\s*=\s*function\s*\([^)]*\)|\w+\s*:\s*function\s*\([^)]*\)/g,
  /\b\w{11,}\b/g,
  /{[^}]*}/g,
  /\([^)]*\)/g,
  /-?\d+(\.\d+)?/g,
  /\W+/g,
  /\b\w{1,2}\b/g,
  /\b[A-Z][a-z]*[a-zA-Z]*\b/g,
];

//initial input and intensity
let input = cleanText(document.body.textContent || document.body.innerText);
let scores = vader.SentimentIntensityAnalyzer.polarity_scores(input);
console.log(scores);
loadThenSave(scores);
const interval$ = Rx.interval(30000);

//reset input and intensity every 5 seconds
interval$.subscribe(() => {
  input = cleanText(document.body.textContent || document.body.innerText);
  scores = vader.SentimentIntensityAnalyzer.polarity_scores(input);
  console.log(scores);
  loadThenSave(scores);
});

function cleanText(text) {
  patterns.forEach((pattern) => {
    text = text.replace(pattern, " ");
  });
  return text;
}

function loadThenSave(scores) {
  chrome.storage.local.get("positive", function (result) {
    positive = result.positive;
    console.log('fetching positive', positive)
    chrome.storage.local.set({ positive: (positive ?? 0) + scores.pos });
  });

  chrome.storage.local.get("negative", function (result) {
    negative = result.negative;
    console.log('fetching negative', negative)
    chrome.storage.local.set({ negative: (negative ?? 0) + scores.neg });
  });
}

},{"rxjs":3,"vader-sentiment":226}],3:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.interval = exports.iif = exports.generate = exports.fromEventPattern = exports.fromEvent = exports.from = exports.forkJoin = exports.empty = exports.defer = exports.connectable = exports.concat = exports.combineLatest = exports.bindNodeCallback = exports.bindCallback = exports.UnsubscriptionError = exports.TimeoutError = exports.SequenceError = exports.ObjectUnsubscribedError = exports.NotFoundError = exports.EmptyError = exports.ArgumentOutOfRangeError = exports.firstValueFrom = exports.lastValueFrom = exports.isObservable = exports.identity = exports.noop = exports.pipe = exports.NotificationKind = exports.Notification = exports.Subscriber = exports.Subscription = exports.Scheduler = exports.VirtualAction = exports.VirtualTimeScheduler = exports.animationFrameScheduler = exports.animationFrame = exports.queueScheduler = exports.queue = exports.asyncScheduler = exports.async = exports.asapScheduler = exports.asap = exports.AsyncSubject = exports.ReplaySubject = exports.BehaviorSubject = exports.Subject = exports.animationFrames = exports.observable = exports.ConnectableObservable = exports.Observable = void 0;
exports.filter = exports.expand = exports.exhaustMap = exports.exhaustAll = exports.exhaust = exports.every = exports.endWith = exports.elementAt = exports.distinctUntilKeyChanged = exports.distinctUntilChanged = exports.distinct = exports.dematerialize = exports.delayWhen = exports.delay = exports.defaultIfEmpty = exports.debounceTime = exports.debounce = exports.count = exports.connect = exports.concatWith = exports.concatMapTo = exports.concatMap = exports.concatAll = exports.combineLatestWith = exports.combineLatestAll = exports.combineAll = exports.catchError = exports.bufferWhen = exports.bufferToggle = exports.bufferTime = exports.bufferCount = exports.buffer = exports.auditTime = exports.audit = exports.config = exports.NEVER = exports.EMPTY = exports.scheduled = exports.zip = exports.using = exports.timer = exports.throwError = exports.range = exports.race = exports.partition = exports.pairs = exports.onErrorResumeNext = exports.of = exports.never = exports.merge = void 0;
exports.switchMap = exports.switchAll = exports.subscribeOn = exports.startWith = exports.skipWhile = exports.skipUntil = exports.skipLast = exports.skip = exports.single = exports.shareReplay = exports.share = exports.sequenceEqual = exports.scan = exports.sampleTime = exports.sample = exports.refCount = exports.retryWhen = exports.retry = exports.repeatWhen = exports.repeat = exports.reduce = exports.raceWith = exports.publishReplay = exports.publishLast = exports.publishBehavior = exports.publish = exports.pluck = exports.pairwise = exports.onErrorResumeNextWith = exports.observeOn = exports.multicast = exports.min = exports.mergeWith = exports.mergeScan = exports.mergeMapTo = exports.mergeMap = exports.flatMap = exports.mergeAll = exports.max = exports.materialize = exports.mapTo = exports.map = exports.last = exports.isEmpty = exports.ignoreElements = exports.groupBy = exports.first = exports.findIndex = exports.find = exports.finalize = void 0;
exports.zipWith = exports.zipAll = exports.withLatestFrom = exports.windowWhen = exports.windowToggle = exports.windowTime = exports.windowCount = exports.window = exports.toArray = exports.timestamp = exports.timeoutWith = exports.timeout = exports.timeInterval = exports.throwIfEmpty = exports.throttleTime = exports.throttle = exports.tap = exports.takeWhile = exports.takeUntil = exports.takeLast = exports.take = exports.switchScan = exports.switchMapTo = void 0;
var Observable_1 = require("./internal/Observable");
Object.defineProperty(exports, "Observable", { enumerable: true, get: function () { return Observable_1.Observable; } });
var ConnectableObservable_1 = require("./internal/observable/ConnectableObservable");
Object.defineProperty(exports, "ConnectableObservable", { enumerable: true, get: function () { return ConnectableObservable_1.ConnectableObservable; } });
var observable_1 = require("./internal/symbol/observable");
Object.defineProperty(exports, "observable", { enumerable: true, get: function () { return observable_1.observable; } });
var animationFrames_1 = require("./internal/observable/dom/animationFrames");
Object.defineProperty(exports, "animationFrames", { enumerable: true, get: function () { return animationFrames_1.animationFrames; } });
var Subject_1 = require("./internal/Subject");
Object.defineProperty(exports, "Subject", { enumerable: true, get: function () { return Subject_1.Subject; } });
var BehaviorSubject_1 = require("./internal/BehaviorSubject");
Object.defineProperty(exports, "BehaviorSubject", { enumerable: true, get: function () { return BehaviorSubject_1.BehaviorSubject; } });
var ReplaySubject_1 = require("./internal/ReplaySubject");
Object.defineProperty(exports, "ReplaySubject", { enumerable: true, get: function () { return ReplaySubject_1.ReplaySubject; } });
var AsyncSubject_1 = require("./internal/AsyncSubject");
Object.defineProperty(exports, "AsyncSubject", { enumerable: true, get: function () { return AsyncSubject_1.AsyncSubject; } });
var asap_1 = require("./internal/scheduler/asap");
Object.defineProperty(exports, "asap", { enumerable: true, get: function () { return asap_1.asap; } });
Object.defineProperty(exports, "asapScheduler", { enumerable: true, get: function () { return asap_1.asapScheduler; } });
var async_1 = require("./internal/scheduler/async");
Object.defineProperty(exports, "async", { enumerable: true, get: function () { return async_1.async; } });
Object.defineProperty(exports, "asyncScheduler", { enumerable: true, get: function () { return async_1.asyncScheduler; } });
var queue_1 = require("./internal/scheduler/queue");
Object.defineProperty(exports, "queue", { enumerable: true, get: function () { return queue_1.queue; } });
Object.defineProperty(exports, "queueScheduler", { enumerable: true, get: function () { return queue_1.queueScheduler; } });
var animationFrame_1 = require("./internal/scheduler/animationFrame");
Object.defineProperty(exports, "animationFrame", { enumerable: true, get: function () { return animationFrame_1.animationFrame; } });
Object.defineProperty(exports, "animationFrameScheduler", { enumerable: true, get: function () { return animationFrame_1.animationFrameScheduler; } });
var VirtualTimeScheduler_1 = require("./internal/scheduler/VirtualTimeScheduler");
Object.defineProperty(exports, "VirtualTimeScheduler", { enumerable: true, get: function () { return VirtualTimeScheduler_1.VirtualTimeScheduler; } });
Object.defineProperty(exports, "VirtualAction", { enumerable: true, get: function () { return VirtualTimeScheduler_1.VirtualAction; } });
var Scheduler_1 = require("./internal/Scheduler");
Object.defineProperty(exports, "Scheduler", { enumerable: true, get: function () { return Scheduler_1.Scheduler; } });
var Subscription_1 = require("./internal/Subscription");
Object.defineProperty(exports, "Subscription", { enumerable: true, get: function () { return Subscription_1.Subscription; } });
var Subscriber_1 = require("./internal/Subscriber");
Object.defineProperty(exports, "Subscriber", { enumerable: true, get: function () { return Subscriber_1.Subscriber; } });
var Notification_1 = require("./internal/Notification");
Object.defineProperty(exports, "Notification", { enumerable: true, get: function () { return Notification_1.Notification; } });
Object.defineProperty(exports, "NotificationKind", { enumerable: true, get: function () { return Notification_1.NotificationKind; } });
var pipe_1 = require("./internal/util/pipe");
Object.defineProperty(exports, "pipe", { enumerable: true, get: function () { return pipe_1.pipe; } });
var noop_1 = require("./internal/util/noop");
Object.defineProperty(exports, "noop", { enumerable: true, get: function () { return noop_1.noop; } });
var identity_1 = require("./internal/util/identity");
Object.defineProperty(exports, "identity", { enumerable: true, get: function () { return identity_1.identity; } });
var isObservable_1 = require("./internal/util/isObservable");
Object.defineProperty(exports, "isObservable", { enumerable: true, get: function () { return isObservable_1.isObservable; } });
var lastValueFrom_1 = require("./internal/lastValueFrom");
Object.defineProperty(exports, "lastValueFrom", { enumerable: true, get: function () { return lastValueFrom_1.lastValueFrom; } });
var firstValueFrom_1 = require("./internal/firstValueFrom");
Object.defineProperty(exports, "firstValueFrom", { enumerable: true, get: function () { return firstValueFrom_1.firstValueFrom; } });
var ArgumentOutOfRangeError_1 = require("./internal/util/ArgumentOutOfRangeError");
Object.defineProperty(exports, "ArgumentOutOfRangeError", { enumerable: true, get: function () { return ArgumentOutOfRangeError_1.ArgumentOutOfRangeError; } });
var EmptyError_1 = require("./internal/util/EmptyError");
Object.defineProperty(exports, "EmptyError", { enumerable: true, get: function () { return EmptyError_1.EmptyError; } });
var NotFoundError_1 = require("./internal/util/NotFoundError");
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return NotFoundError_1.NotFoundError; } });
var ObjectUnsubscribedError_1 = require("./internal/util/ObjectUnsubscribedError");
Object.defineProperty(exports, "ObjectUnsubscribedError", { enumerable: true, get: function () { return ObjectUnsubscribedError_1.ObjectUnsubscribedError; } });
var SequenceError_1 = require("./internal/util/SequenceError");
Object.defineProperty(exports, "SequenceError", { enumerable: true, get: function () { return SequenceError_1.SequenceError; } });
var timeout_1 = require("./internal/operators/timeout");
Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function () { return timeout_1.TimeoutError; } });
var UnsubscriptionError_1 = require("./internal/util/UnsubscriptionError");
Object.defineProperty(exports, "UnsubscriptionError", { enumerable: true, get: function () { return UnsubscriptionError_1.UnsubscriptionError; } });
var bindCallback_1 = require("./internal/observable/bindCallback");
Object.defineProperty(exports, "bindCallback", { enumerable: true, get: function () { return bindCallback_1.bindCallback; } });
var bindNodeCallback_1 = require("./internal/observable/bindNodeCallback");
Object.defineProperty(exports, "bindNodeCallback", { enumerable: true, get: function () { return bindNodeCallback_1.bindNodeCallback; } });
var combineLatest_1 = require("./internal/observable/combineLatest");
Object.defineProperty(exports, "combineLatest", { enumerable: true, get: function () { return combineLatest_1.combineLatest; } });
var concat_1 = require("./internal/observable/concat");
Object.defineProperty(exports, "concat", { enumerable: true, get: function () { return concat_1.concat; } });
var connectable_1 = require("./internal/observable/connectable");
Object.defineProperty(exports, "connectable", { enumerable: true, get: function () { return connectable_1.connectable; } });
var defer_1 = require("./internal/observable/defer");
Object.defineProperty(exports, "defer", { enumerable: true, get: function () { return defer_1.defer; } });
var empty_1 = require("./internal/observable/empty");
Object.defineProperty(exports, "empty", { enumerable: true, get: function () { return empty_1.empty; } });
var forkJoin_1 = require("./internal/observable/forkJoin");
Object.defineProperty(exports, "forkJoin", { enumerable: true, get: function () { return forkJoin_1.forkJoin; } });
var from_1 = require("./internal/observable/from");
Object.defineProperty(exports, "from", { enumerable: true, get: function () { return from_1.from; } });
var fromEvent_1 = require("./internal/observable/fromEvent");
Object.defineProperty(exports, "fromEvent", { enumerable: true, get: function () { return fromEvent_1.fromEvent; } });
var fromEventPattern_1 = require("./internal/observable/fromEventPattern");
Object.defineProperty(exports, "fromEventPattern", { enumerable: true, get: function () { return fromEventPattern_1.fromEventPattern; } });
var generate_1 = require("./internal/observable/generate");
Object.defineProperty(exports, "generate", { enumerable: true, get: function () { return generate_1.generate; } });
var iif_1 = require("./internal/observable/iif");
Object.defineProperty(exports, "iif", { enumerable: true, get: function () { return iif_1.iif; } });
var interval_1 = require("./internal/observable/interval");
Object.defineProperty(exports, "interval", { enumerable: true, get: function () { return interval_1.interval; } });
var merge_1 = require("./internal/observable/merge");
Object.defineProperty(exports, "merge", { enumerable: true, get: function () { return merge_1.merge; } });
var never_1 = require("./internal/observable/never");
Object.defineProperty(exports, "never", { enumerable: true, get: function () { return never_1.never; } });
var of_1 = require("./internal/observable/of");
Object.defineProperty(exports, "of", { enumerable: true, get: function () { return of_1.of; } });
var onErrorResumeNext_1 = require("./internal/observable/onErrorResumeNext");
Object.defineProperty(exports, "onErrorResumeNext", { enumerable: true, get: function () { return onErrorResumeNext_1.onErrorResumeNext; } });
var pairs_1 = require("./internal/observable/pairs");
Object.defineProperty(exports, "pairs", { enumerable: true, get: function () { return pairs_1.pairs; } });
var partition_1 = require("./internal/observable/partition");
Object.defineProperty(exports, "partition", { enumerable: true, get: function () { return partition_1.partition; } });
var race_1 = require("./internal/observable/race");
Object.defineProperty(exports, "race", { enumerable: true, get: function () { return race_1.race; } });
var range_1 = require("./internal/observable/range");
Object.defineProperty(exports, "range", { enumerable: true, get: function () { return range_1.range; } });
var throwError_1 = require("./internal/observable/throwError");
Object.defineProperty(exports, "throwError", { enumerable: true, get: function () { return throwError_1.throwError; } });
var timer_1 = require("./internal/observable/timer");
Object.defineProperty(exports, "timer", { enumerable: true, get: function () { return timer_1.timer; } });
var using_1 = require("./internal/observable/using");
Object.defineProperty(exports, "using", { enumerable: true, get: function () { return using_1.using; } });
var zip_1 = require("./internal/observable/zip");
Object.defineProperty(exports, "zip", { enumerable: true, get: function () { return zip_1.zip; } });
var scheduled_1 = require("./internal/scheduled/scheduled");
Object.defineProperty(exports, "scheduled", { enumerable: true, get: function () { return scheduled_1.scheduled; } });
var empty_2 = require("./internal/observable/empty");
Object.defineProperty(exports, "EMPTY", { enumerable: true, get: function () { return empty_2.EMPTY; } });
var never_2 = require("./internal/observable/never");
Object.defineProperty(exports, "NEVER", { enumerable: true, get: function () { return never_2.NEVER; } });
__exportStar(require("./internal/types"), exports);
var config_1 = require("./internal/config");
Object.defineProperty(exports, "config", { enumerable: true, get: function () { return config_1.config; } });
var audit_1 = require("./internal/operators/audit");
Object.defineProperty(exports, "audit", { enumerable: true, get: function () { return audit_1.audit; } });
var auditTime_1 = require("./internal/operators/auditTime");
Object.defineProperty(exports, "auditTime", { enumerable: true, get: function () { return auditTime_1.auditTime; } });
var buffer_1 = require("./internal/operators/buffer");
Object.defineProperty(exports, "buffer", { enumerable: true, get: function () { return buffer_1.buffer; } });
var bufferCount_1 = require("./internal/operators/bufferCount");
Object.defineProperty(exports, "bufferCount", { enumerable: true, get: function () { return bufferCount_1.bufferCount; } });
var bufferTime_1 = require("./internal/operators/bufferTime");
Object.defineProperty(exports, "bufferTime", { enumerable: true, get: function () { return bufferTime_1.bufferTime; } });
var bufferToggle_1 = require("./internal/operators/bufferToggle");
Object.defineProperty(exports, "bufferToggle", { enumerable: true, get: function () { return bufferToggle_1.bufferToggle; } });
var bufferWhen_1 = require("./internal/operators/bufferWhen");
Object.defineProperty(exports, "bufferWhen", { enumerable: true, get: function () { return bufferWhen_1.bufferWhen; } });
var catchError_1 = require("./internal/operators/catchError");
Object.defineProperty(exports, "catchError", { enumerable: true, get: function () { return catchError_1.catchError; } });
var combineAll_1 = require("./internal/operators/combineAll");
Object.defineProperty(exports, "combineAll", { enumerable: true, get: function () { return combineAll_1.combineAll; } });
var combineLatestAll_1 = require("./internal/operators/combineLatestAll");
Object.defineProperty(exports, "combineLatestAll", { enumerable: true, get: function () { return combineLatestAll_1.combineLatestAll; } });
var combineLatestWith_1 = require("./internal/operators/combineLatestWith");
Object.defineProperty(exports, "combineLatestWith", { enumerable: true, get: function () { return combineLatestWith_1.combineLatestWith; } });
var concatAll_1 = require("./internal/operators/concatAll");
Object.defineProperty(exports, "concatAll", { enumerable: true, get: function () { return concatAll_1.concatAll; } });
var concatMap_1 = require("./internal/operators/concatMap");
Object.defineProperty(exports, "concatMap", { enumerable: true, get: function () { return concatMap_1.concatMap; } });
var concatMapTo_1 = require("./internal/operators/concatMapTo");
Object.defineProperty(exports, "concatMapTo", { enumerable: true, get: function () { return concatMapTo_1.concatMapTo; } });
var concatWith_1 = require("./internal/operators/concatWith");
Object.defineProperty(exports, "concatWith", { enumerable: true, get: function () { return concatWith_1.concatWith; } });
var connect_1 = require("./internal/operators/connect");
Object.defineProperty(exports, "connect", { enumerable: true, get: function () { return connect_1.connect; } });
var count_1 = require("./internal/operators/count");
Object.defineProperty(exports, "count", { enumerable: true, get: function () { return count_1.count; } });
var debounce_1 = require("./internal/operators/debounce");
Object.defineProperty(exports, "debounce", { enumerable: true, get: function () { return debounce_1.debounce; } });
var debounceTime_1 = require("./internal/operators/debounceTime");
Object.defineProperty(exports, "debounceTime", { enumerable: true, get: function () { return debounceTime_1.debounceTime; } });
var defaultIfEmpty_1 = require("./internal/operators/defaultIfEmpty");
Object.defineProperty(exports, "defaultIfEmpty", { enumerable: true, get: function () { return defaultIfEmpty_1.defaultIfEmpty; } });
var delay_1 = require("./internal/operators/delay");
Object.defineProperty(exports, "delay", { enumerable: true, get: function () { return delay_1.delay; } });
var delayWhen_1 = require("./internal/operators/delayWhen");
Object.defineProperty(exports, "delayWhen", { enumerable: true, get: function () { return delayWhen_1.delayWhen; } });
var dematerialize_1 = require("./internal/operators/dematerialize");
Object.defineProperty(exports, "dematerialize", { enumerable: true, get: function () { return dematerialize_1.dematerialize; } });
var distinct_1 = require("./internal/operators/distinct");
Object.defineProperty(exports, "distinct", { enumerable: true, get: function () { return distinct_1.distinct; } });
var distinctUntilChanged_1 = require("./internal/operators/distinctUntilChanged");
Object.defineProperty(exports, "distinctUntilChanged", { enumerable: true, get: function () { return distinctUntilChanged_1.distinctUntilChanged; } });
var distinctUntilKeyChanged_1 = require("./internal/operators/distinctUntilKeyChanged");
Object.defineProperty(exports, "distinctUntilKeyChanged", { enumerable: true, get: function () { return distinctUntilKeyChanged_1.distinctUntilKeyChanged; } });
var elementAt_1 = require("./internal/operators/elementAt");
Object.defineProperty(exports, "elementAt", { enumerable: true, get: function () { return elementAt_1.elementAt; } });
var endWith_1 = require("./internal/operators/endWith");
Object.defineProperty(exports, "endWith", { enumerable: true, get: function () { return endWith_1.endWith; } });
var every_1 = require("./internal/operators/every");
Object.defineProperty(exports, "every", { enumerable: true, get: function () { return every_1.every; } });
var exhaust_1 = require("./internal/operators/exhaust");
Object.defineProperty(exports, "exhaust", { enumerable: true, get: function () { return exhaust_1.exhaust; } });
var exhaustAll_1 = require("./internal/operators/exhaustAll");
Object.defineProperty(exports, "exhaustAll", { enumerable: true, get: function () { return exhaustAll_1.exhaustAll; } });
var exhaustMap_1 = require("./internal/operators/exhaustMap");
Object.defineProperty(exports, "exhaustMap", { enumerable: true, get: function () { return exhaustMap_1.exhaustMap; } });
var expand_1 = require("./internal/operators/expand");
Object.defineProperty(exports, "expand", { enumerable: true, get: function () { return expand_1.expand; } });
var filter_1 = require("./internal/operators/filter");
Object.defineProperty(exports, "filter", { enumerable: true, get: function () { return filter_1.filter; } });
var finalize_1 = require("./internal/operators/finalize");
Object.defineProperty(exports, "finalize", { enumerable: true, get: function () { return finalize_1.finalize; } });
var find_1 = require("./internal/operators/find");
Object.defineProperty(exports, "find", { enumerable: true, get: function () { return find_1.find; } });
var findIndex_1 = require("./internal/operators/findIndex");
Object.defineProperty(exports, "findIndex", { enumerable: true, get: function () { return findIndex_1.findIndex; } });
var first_1 = require("./internal/operators/first");
Object.defineProperty(exports, "first", { enumerable: true, get: function () { return first_1.first; } });
var groupBy_1 = require("./internal/operators/groupBy");
Object.defineProperty(exports, "groupBy", { enumerable: true, get: function () { return groupBy_1.groupBy; } });
var ignoreElements_1 = require("./internal/operators/ignoreElements");
Object.defineProperty(exports, "ignoreElements", { enumerable: true, get: function () { return ignoreElements_1.ignoreElements; } });
var isEmpty_1 = require("./internal/operators/isEmpty");
Object.defineProperty(exports, "isEmpty", { enumerable: true, get: function () { return isEmpty_1.isEmpty; } });
var last_1 = require("./internal/operators/last");
Object.defineProperty(exports, "last", { enumerable: true, get: function () { return last_1.last; } });
var map_1 = require("./internal/operators/map");
Object.defineProperty(exports, "map", { enumerable: true, get: function () { return map_1.map; } });
var mapTo_1 = require("./internal/operators/mapTo");
Object.defineProperty(exports, "mapTo", { enumerable: true, get: function () { return mapTo_1.mapTo; } });
var materialize_1 = require("./internal/operators/materialize");
Object.defineProperty(exports, "materialize", { enumerable: true, get: function () { return materialize_1.materialize; } });
var max_1 = require("./internal/operators/max");
Object.defineProperty(exports, "max", { enumerable: true, get: function () { return max_1.max; } });
var mergeAll_1 = require("./internal/operators/mergeAll");
Object.defineProperty(exports, "mergeAll", { enumerable: true, get: function () { return mergeAll_1.mergeAll; } });
var flatMap_1 = require("./internal/operators/flatMap");
Object.defineProperty(exports, "flatMap", { enumerable: true, get: function () { return flatMap_1.flatMap; } });
var mergeMap_1 = require("./internal/operators/mergeMap");
Object.defineProperty(exports, "mergeMap", { enumerable: true, get: function () { return mergeMap_1.mergeMap; } });
var mergeMapTo_1 = require("./internal/operators/mergeMapTo");
Object.defineProperty(exports, "mergeMapTo", { enumerable: true, get: function () { return mergeMapTo_1.mergeMapTo; } });
var mergeScan_1 = require("./internal/operators/mergeScan");
Object.defineProperty(exports, "mergeScan", { enumerable: true, get: function () { return mergeScan_1.mergeScan; } });
var mergeWith_1 = require("./internal/operators/mergeWith");
Object.defineProperty(exports, "mergeWith", { enumerable: true, get: function () { return mergeWith_1.mergeWith; } });
var min_1 = require("./internal/operators/min");
Object.defineProperty(exports, "min", { enumerable: true, get: function () { return min_1.min; } });
var multicast_1 = require("./internal/operators/multicast");
Object.defineProperty(exports, "multicast", { enumerable: true, get: function () { return multicast_1.multicast; } });
var observeOn_1 = require("./internal/operators/observeOn");
Object.defineProperty(exports, "observeOn", { enumerable: true, get: function () { return observeOn_1.observeOn; } });
var onErrorResumeNextWith_1 = require("./internal/operators/onErrorResumeNextWith");
Object.defineProperty(exports, "onErrorResumeNextWith", { enumerable: true, get: function () { return onErrorResumeNextWith_1.onErrorResumeNextWith; } });
var pairwise_1 = require("./internal/operators/pairwise");
Object.defineProperty(exports, "pairwise", { enumerable: true, get: function () { return pairwise_1.pairwise; } });
var pluck_1 = require("./internal/operators/pluck");
Object.defineProperty(exports, "pluck", { enumerable: true, get: function () { return pluck_1.pluck; } });
var publish_1 = require("./internal/operators/publish");
Object.defineProperty(exports, "publish", { enumerable: true, get: function () { return publish_1.publish; } });
var publishBehavior_1 = require("./internal/operators/publishBehavior");
Object.defineProperty(exports, "publishBehavior", { enumerable: true, get: function () { return publishBehavior_1.publishBehavior; } });
var publishLast_1 = require("./internal/operators/publishLast");
Object.defineProperty(exports, "publishLast", { enumerable: true, get: function () { return publishLast_1.publishLast; } });
var publishReplay_1 = require("./internal/operators/publishReplay");
Object.defineProperty(exports, "publishReplay", { enumerable: true, get: function () { return publishReplay_1.publishReplay; } });
var raceWith_1 = require("./internal/operators/raceWith");
Object.defineProperty(exports, "raceWith", { enumerable: true, get: function () { return raceWith_1.raceWith; } });
var reduce_1 = require("./internal/operators/reduce");
Object.defineProperty(exports, "reduce", { enumerable: true, get: function () { return reduce_1.reduce; } });
var repeat_1 = require("./internal/operators/repeat");
Object.defineProperty(exports, "repeat", { enumerable: true, get: function () { return repeat_1.repeat; } });
var repeatWhen_1 = require("./internal/operators/repeatWhen");
Object.defineProperty(exports, "repeatWhen", { enumerable: true, get: function () { return repeatWhen_1.repeatWhen; } });
var retry_1 = require("./internal/operators/retry");
Object.defineProperty(exports, "retry", { enumerable: true, get: function () { return retry_1.retry; } });
var retryWhen_1 = require("./internal/operators/retryWhen");
Object.defineProperty(exports, "retryWhen", { enumerable: true, get: function () { return retryWhen_1.retryWhen; } });
var refCount_1 = require("./internal/operators/refCount");
Object.defineProperty(exports, "refCount", { enumerable: true, get: function () { return refCount_1.refCount; } });
var sample_1 = require("./internal/operators/sample");
Object.defineProperty(exports, "sample", { enumerable: true, get: function () { return sample_1.sample; } });
var sampleTime_1 = require("./internal/operators/sampleTime");
Object.defineProperty(exports, "sampleTime", { enumerable: true, get: function () { return sampleTime_1.sampleTime; } });
var scan_1 = require("./internal/operators/scan");
Object.defineProperty(exports, "scan", { enumerable: true, get: function () { return scan_1.scan; } });
var sequenceEqual_1 = require("./internal/operators/sequenceEqual");
Object.defineProperty(exports, "sequenceEqual", { enumerable: true, get: function () { return sequenceEqual_1.sequenceEqual; } });
var share_1 = require("./internal/operators/share");
Object.defineProperty(exports, "share", { enumerable: true, get: function () { return share_1.share; } });
var shareReplay_1 = require("./internal/operators/shareReplay");
Object.defineProperty(exports, "shareReplay", { enumerable: true, get: function () { return shareReplay_1.shareReplay; } });
var single_1 = require("./internal/operators/single");
Object.defineProperty(exports, "single", { enumerable: true, get: function () { return single_1.single; } });
var skip_1 = require("./internal/operators/skip");
Object.defineProperty(exports, "skip", { enumerable: true, get: function () { return skip_1.skip; } });
var skipLast_1 = require("./internal/operators/skipLast");
Object.defineProperty(exports, "skipLast", { enumerable: true, get: function () { return skipLast_1.skipLast; } });
var skipUntil_1 = require("./internal/operators/skipUntil");
Object.defineProperty(exports, "skipUntil", { enumerable: true, get: function () { return skipUntil_1.skipUntil; } });
var skipWhile_1 = require("./internal/operators/skipWhile");
Object.defineProperty(exports, "skipWhile", { enumerable: true, get: function () { return skipWhile_1.skipWhile; } });
var startWith_1 = require("./internal/operators/startWith");
Object.defineProperty(exports, "startWith", { enumerable: true, get: function () { return startWith_1.startWith; } });
var subscribeOn_1 = require("./internal/operators/subscribeOn");
Object.defineProperty(exports, "subscribeOn", { enumerable: true, get: function () { return subscribeOn_1.subscribeOn; } });
var switchAll_1 = require("./internal/operators/switchAll");
Object.defineProperty(exports, "switchAll", { enumerable: true, get: function () { return switchAll_1.switchAll; } });
var switchMap_1 = require("./internal/operators/switchMap");
Object.defineProperty(exports, "switchMap", { enumerable: true, get: function () { return switchMap_1.switchMap; } });
var switchMapTo_1 = require("./internal/operators/switchMapTo");
Object.defineProperty(exports, "switchMapTo", { enumerable: true, get: function () { return switchMapTo_1.switchMapTo; } });
var switchScan_1 = require("./internal/operators/switchScan");
Object.defineProperty(exports, "switchScan", { enumerable: true, get: function () { return switchScan_1.switchScan; } });
var take_1 = require("./internal/operators/take");
Object.defineProperty(exports, "take", { enumerable: true, get: function () { return take_1.take; } });
var takeLast_1 = require("./internal/operators/takeLast");
Object.defineProperty(exports, "takeLast", { enumerable: true, get: function () { return takeLast_1.takeLast; } });
var takeUntil_1 = require("./internal/operators/takeUntil");
Object.defineProperty(exports, "takeUntil", { enumerable: true, get: function () { return takeUntil_1.takeUntil; } });
var takeWhile_1 = require("./internal/operators/takeWhile");
Object.defineProperty(exports, "takeWhile", { enumerable: true, get: function () { return takeWhile_1.takeWhile; } });
var tap_1 = require("./internal/operators/tap");
Object.defineProperty(exports, "tap", { enumerable: true, get: function () { return tap_1.tap; } });
var throttle_1 = require("./internal/operators/throttle");
Object.defineProperty(exports, "throttle", { enumerable: true, get: function () { return throttle_1.throttle; } });
var throttleTime_1 = require("./internal/operators/throttleTime");
Object.defineProperty(exports, "throttleTime", { enumerable: true, get: function () { return throttleTime_1.throttleTime; } });
var throwIfEmpty_1 = require("./internal/operators/throwIfEmpty");
Object.defineProperty(exports, "throwIfEmpty", { enumerable: true, get: function () { return throwIfEmpty_1.throwIfEmpty; } });
var timeInterval_1 = require("./internal/operators/timeInterval");
Object.defineProperty(exports, "timeInterval", { enumerable: true, get: function () { return timeInterval_1.timeInterval; } });
var timeout_2 = require("./internal/operators/timeout");
Object.defineProperty(exports, "timeout", { enumerable: true, get: function () { return timeout_2.timeout; } });
var timeoutWith_1 = require("./internal/operators/timeoutWith");
Object.defineProperty(exports, "timeoutWith", { enumerable: true, get: function () { return timeoutWith_1.timeoutWith; } });
var timestamp_1 = require("./internal/operators/timestamp");
Object.defineProperty(exports, "timestamp", { enumerable: true, get: function () { return timestamp_1.timestamp; } });
var toArray_1 = require("./internal/operators/toArray");
Object.defineProperty(exports, "toArray", { enumerable: true, get: function () { return toArray_1.toArray; } });
var window_1 = require("./internal/operators/window");
Object.defineProperty(exports, "window", { enumerable: true, get: function () { return window_1.window; } });
var windowCount_1 = require("./internal/operators/windowCount");
Object.defineProperty(exports, "windowCount", { enumerable: true, get: function () { return windowCount_1.windowCount; } });
var windowTime_1 = require("./internal/operators/windowTime");
Object.defineProperty(exports, "windowTime", { enumerable: true, get: function () { return windowTime_1.windowTime; } });
var windowToggle_1 = require("./internal/operators/windowToggle");
Object.defineProperty(exports, "windowToggle", { enumerable: true, get: function () { return windowToggle_1.windowToggle; } });
var windowWhen_1 = require("./internal/operators/windowWhen");
Object.defineProperty(exports, "windowWhen", { enumerable: true, get: function () { return windowWhen_1.windowWhen; } });
var withLatestFrom_1 = require("./internal/operators/withLatestFrom");
Object.defineProperty(exports, "withLatestFrom", { enumerable: true, get: function () { return withLatestFrom_1.withLatestFrom; } });
var zipAll_1 = require("./internal/operators/zipAll");
Object.defineProperty(exports, "zipAll", { enumerable: true, get: function () { return zipAll_1.zipAll; } });
var zipWith_1 = require("./internal/operators/zipWith");
Object.defineProperty(exports, "zipWith", { enumerable: true, get: function () { return zipWith_1.zipWith; } });

},{"./internal/AsyncSubject":4,"./internal/BehaviorSubject":5,"./internal/Notification":6,"./internal/Observable":8,"./internal/ReplaySubject":9,"./internal/Scheduler":10,"./internal/Subject":11,"./internal/Subscriber":12,"./internal/Subscription":13,"./internal/config":14,"./internal/firstValueFrom":15,"./internal/lastValueFrom":16,"./internal/observable/ConnectableObservable":17,"./internal/observable/bindCallback":18,"./internal/observable/bindNodeCallback":20,"./internal/observable/combineLatest":21,"./internal/observable/concat":22,"./internal/observable/connectable":23,"./internal/observable/defer":24,"./internal/observable/dom/animationFrames":25,"./internal/observable/empty":26,"./internal/observable/forkJoin":27,"./internal/observable/from":28,"./internal/observable/fromEvent":29,"./internal/observable/fromEventPattern":30,"./internal/observable/generate":32,"./internal/observable/iif":33,"./internal/observable/interval":35,"./internal/observable/merge":36,"./internal/observable/never":37,"./internal/observable/of":38,"./internal/observable/onErrorResumeNext":39,"./internal/observable/pairs":40,"./internal/observable/partition":41,"./internal/observable/race":42,"./internal/observable/range":43,"./internal/observable/throwError":44,"./internal/observable/timer":45,"./internal/observable/using":46,"./internal/observable/zip":47,"./internal/operators/audit":49,"./internal/operators/auditTime":50,"./internal/operators/buffer":51,"./internal/operators/bufferCount":52,"./internal/operators/bufferTime":53,"./internal/operators/bufferToggle":54,"./internal/operators/bufferWhen":55,"./internal/operators/catchError":56,"./internal/operators/combineAll":57,"./internal/operators/combineLatestAll":59,"./internal/operators/combineLatestWith":60,"./internal/operators/concatAll":62,"./internal/operators/concatMap":63,"./internal/operators/concatMapTo":64,"./internal/operators/concatWith":65,"./internal/operators/connect":66,"./internal/operators/count":67,"./internal/operators/debounce":68,"./internal/operators/debounceTime":69,"./internal/operators/defaultIfEmpty":70,"./internal/operators/delay":71,"./internal/operators/delayWhen":72,"./internal/operators/dematerialize":73,"./internal/operators/distinct":74,"./internal/operators/distinctUntilChanged":75,"./internal/operators/distinctUntilKeyChanged":76,"./internal/operators/elementAt":77,"./internal/operators/endWith":78,"./internal/operators/every":79,"./internal/operators/exhaust":80,"./internal/operators/exhaustAll":81,"./internal/operators/exhaustMap":82,"./internal/operators/expand":83,"./internal/operators/filter":84,"./internal/operators/finalize":85,"./internal/operators/find":86,"./internal/operators/findIndex":87,"./internal/operators/first":88,"./internal/operators/flatMap":89,"./internal/operators/groupBy":90,"./internal/operators/ignoreElements":91,"./internal/operators/isEmpty":92,"./internal/operators/last":94,"./internal/operators/map":95,"./internal/operators/mapTo":96,"./internal/operators/materialize":97,"./internal/operators/max":98,"./internal/operators/mergeAll":100,"./internal/operators/mergeMap":102,"./internal/operators/mergeMapTo":103,"./internal/operators/mergeScan":104,"./internal/operators/mergeWith":105,"./internal/operators/min":106,"./internal/operators/multicast":107,"./internal/operators/observeOn":108,"./internal/operators/onErrorResumeNextWith":109,"./internal/operators/pairwise":110,"./internal/operators/pluck":111,"./internal/operators/publish":112,"./internal/operators/publishBehavior":113,"./internal/operators/publishLast":114,"./internal/operators/publishReplay":115,"./internal/operators/raceWith":116,"./internal/operators/reduce":117,"./internal/operators/refCount":118,"./internal/operators/repeat":119,"./internal/operators/repeatWhen":120,"./internal/operators/retry":121,"./internal/operators/retryWhen":122,"./internal/operators/sample":123,"./internal/operators/sampleTime":124,"./internal/operators/scan":125,"./internal/operators/sequenceEqual":127,"./internal/operators/share":128,"./internal/operators/shareReplay":129,"./internal/operators/single":130,"./internal/operators/skip":131,"./internal/operators/skipLast":132,"./internal/operators/skipUntil":133,"./internal/operators/skipWhile":134,"./internal/operators/startWith":135,"./internal/operators/subscribeOn":136,"./internal/operators/switchAll":137,"./internal/operators/switchMap":138,"./internal/operators/switchMapTo":139,"./internal/operators/switchScan":140,"./internal/operators/take":141,"./internal/operators/takeLast":142,"./internal/operators/takeUntil":143,"./internal/operators/takeWhile":144,"./internal/operators/tap":145,"./internal/operators/throttle":146,"./internal/operators/throttleTime":147,"./internal/operators/throwIfEmpty":148,"./internal/operators/timeInterval":149,"./internal/operators/timeout":150,"./internal/operators/timeoutWith":151,"./internal/operators/timestamp":152,"./internal/operators/toArray":153,"./internal/operators/window":154,"./internal/operators/windowCount":155,"./internal/operators/windowTime":156,"./internal/operators/windowToggle":157,"./internal/operators/windowWhen":158,"./internal/operators/withLatestFrom":159,"./internal/operators/zipAll":161,"./internal/operators/zipWith":162,"./internal/scheduled/scheduled":169,"./internal/scheduler/VirtualTimeScheduler":179,"./internal/scheduler/animationFrame":180,"./internal/scheduler/asap":182,"./internal/scheduler/async":183,"./internal/scheduler/queue":188,"./internal/symbol/observable":191,"./internal/types":192,"./internal/util/ArgumentOutOfRangeError":193,"./internal/util/EmptyError":194,"./internal/util/NotFoundError":196,"./internal/util/ObjectUnsubscribedError":197,"./internal/util/SequenceError":198,"./internal/util/UnsubscriptionError":199,"./internal/util/identity":208,"./internal/util/isObservable":215,"./internal/util/noop":221,"./internal/util/pipe":223}],4:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncSubject = void 0;
var Subject_1 = require("./Subject");
var AsyncSubject = (function (_super) {
    __extends(AsyncSubject, _super);
    function AsyncSubject() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._value = null;
        _this._hasValue = false;
        _this._isComplete = false;
        return _this;
    }
    AsyncSubject.prototype._checkFinalizedStatuses = function (subscriber) {
        var _a = this, hasError = _a.hasError, _hasValue = _a._hasValue, _value = _a._value, thrownError = _a.thrownError, isStopped = _a.isStopped, _isComplete = _a._isComplete;
        if (hasError) {
            subscriber.error(thrownError);
        }
        else if (isStopped || _isComplete) {
            _hasValue && subscriber.next(_value);
            subscriber.complete();
        }
    };
    AsyncSubject.prototype.next = function (value) {
        if (!this.isStopped) {
            this._value = value;
            this._hasValue = true;
        }
    };
    AsyncSubject.prototype.complete = function () {
        var _a = this, _hasValue = _a._hasValue, _value = _a._value, _isComplete = _a._isComplete;
        if (!_isComplete) {
            this._isComplete = true;
            _hasValue && _super.prototype.next.call(this, _value);
            _super.prototype.complete.call(this);
        }
    };
    return AsyncSubject;
}(Subject_1.Subject));
exports.AsyncSubject = AsyncSubject;

},{"./Subject":11}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehaviorSubject = void 0;
var Subject_1 = require("./Subject");
var BehaviorSubject = (function (_super) {
    __extends(BehaviorSubject, _super);
    function BehaviorSubject(_value) {
        var _this = _super.call(this) || this;
        _this._value = _value;
        return _this;
    }
    Object.defineProperty(BehaviorSubject.prototype, "value", {
        get: function () {
            return this.getValue();
        },
        enumerable: false,
        configurable: true
    });
    BehaviorSubject.prototype._subscribe = function (subscriber) {
        var subscription = _super.prototype._subscribe.call(this, subscriber);
        !subscription.closed && subscriber.next(this._value);
        return subscription;
    };
    BehaviorSubject.prototype.getValue = function () {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, _value = _a._value;
        if (hasError) {
            throw thrownError;
        }
        this._throwIfClosed();
        return _value;
    };
    BehaviorSubject.prototype.next = function (value) {
        _super.prototype.next.call(this, (this._value = value));
    };
    return BehaviorSubject;
}(Subject_1.Subject));
exports.BehaviorSubject = BehaviorSubject;

},{"./Subject":11}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observeNotification = exports.Notification = exports.NotificationKind = void 0;
var empty_1 = require("./observable/empty");
var of_1 = require("./observable/of");
var throwError_1 = require("./observable/throwError");
var isFunction_1 = require("./util/isFunction");
var NotificationKind;
(function (NotificationKind) {
    NotificationKind["NEXT"] = "N";
    NotificationKind["ERROR"] = "E";
    NotificationKind["COMPLETE"] = "C";
})(NotificationKind = exports.NotificationKind || (exports.NotificationKind = {}));
var Notification = (function () {
    function Notification(kind, value, error) {
        this.kind = kind;
        this.value = value;
        this.error = error;
        this.hasValue = kind === 'N';
    }
    Notification.prototype.observe = function (observer) {
        return observeNotification(this, observer);
    };
    Notification.prototype.do = function (nextHandler, errorHandler, completeHandler) {
        var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
        return kind === 'N' ? nextHandler === null || nextHandler === void 0 ? void 0 : nextHandler(value) : kind === 'E' ? errorHandler === null || errorHandler === void 0 ? void 0 : errorHandler(error) : completeHandler === null || completeHandler === void 0 ? void 0 : completeHandler();
    };
    Notification.prototype.accept = function (nextOrObserver, error, complete) {
        var _a;
        return isFunction_1.isFunction((_a = nextOrObserver) === null || _a === void 0 ? void 0 : _a.next)
            ? this.observe(nextOrObserver)
            : this.do(nextOrObserver, error, complete);
    };
    Notification.prototype.toObservable = function () {
        var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
        var result = kind === 'N'
            ?
                of_1.of(value)
            :
                kind === 'E'
                    ?
                        throwError_1.throwError(function () { return error; })
                    :
                        kind === 'C'
                            ?
                                empty_1.EMPTY
                            :
                                0;
        if (!result) {
            throw new TypeError("Unexpected notification kind " + kind);
        }
        return result;
    };
    Notification.createNext = function (value) {
        return new Notification('N', value);
    };
    Notification.createError = function (err) {
        return new Notification('E', undefined, err);
    };
    Notification.createComplete = function () {
        return Notification.completeNotification;
    };
    Notification.completeNotification = new Notification('C');
    return Notification;
}());
exports.Notification = Notification;
function observeNotification(notification, observer) {
    var _a, _b, _c;
    var _d = notification, kind = _d.kind, value = _d.value, error = _d.error;
    if (typeof kind !== 'string') {
        throw new TypeError('Invalid notification, missing "kind"');
    }
    kind === 'N' ? (_a = observer.next) === null || _a === void 0 ? void 0 : _a.call(observer, value) : kind === 'E' ? (_b = observer.error) === null || _b === void 0 ? void 0 : _b.call(observer, error) : (_c = observer.complete) === null || _c === void 0 ? void 0 : _c.call(observer);
}
exports.observeNotification = observeNotification;

},{"./observable/empty":26,"./observable/of":38,"./observable/throwError":44,"./util/isFunction":212}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.nextNotification = exports.errorNotification = exports.COMPLETE_NOTIFICATION = void 0;
exports.COMPLETE_NOTIFICATION = (function () { return createNotification('C', undefined, undefined); })();
function errorNotification(error) {
    return createNotification('E', undefined, error);
}
exports.errorNotification = errorNotification;
function nextNotification(value) {
    return createNotification('N', value, undefined);
}
exports.nextNotification = nextNotification;
function createNotification(kind, value, error) {
    return {
        kind: kind,
        value: value,
        error: error,
    };
}
exports.createNotification = createNotification;

},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Observable = void 0;
var Subscriber_1 = require("./Subscriber");
var Subscription_1 = require("./Subscription");
var observable_1 = require("./symbol/observable");
var pipe_1 = require("./util/pipe");
var config_1 = require("./config");
var isFunction_1 = require("./util/isFunction");
var errorContext_1 = require("./util/errorContext");
var Observable = (function () {
    function Observable(subscribe) {
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    Observable.prototype.lift = function (operator) {
        var observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    };
    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var _this = this;
        var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new Subscriber_1.SafeSubscriber(observerOrNext, error, complete);
        errorContext_1.errorContext(function () {
            var _a = _this, operator = _a.operator, source = _a.source;
            subscriber.add(operator
                ?
                    operator.call(subscriber, source)
                : source
                    ?
                        _this._subscribe(subscriber)
                    :
                        _this._trySubscribe(subscriber));
        });
        return subscriber;
    };
    Observable.prototype._trySubscribe = function (sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            sink.error(err);
        }
    };
    Observable.prototype.forEach = function (next, promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var subscriber = new Subscriber_1.SafeSubscriber({
                next: function (value) {
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscriber.unsubscribe();
                    }
                },
                error: reject,
                complete: resolve,
            });
            _this.subscribe(subscriber);
        });
    };
    Observable.prototype._subscribe = function (subscriber) {
        var _a;
        return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
    };
    Observable.prototype[observable_1.observable] = function () {
        return this;
    };
    Observable.prototype.pipe = function () {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            operations[_i] = arguments[_i];
        }
        return pipe_1.pipeFromArray(operations)(this);
    };
    Observable.prototype.toPromise = function (promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var value;
            _this.subscribe(function (x) { return (value = x); }, function (err) { return reject(err); }, function () { return resolve(value); });
        });
    };
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());
exports.Observable = Observable;
function getPromiseCtor(promiseCtor) {
    var _a;
    return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config_1.config.Promise) !== null && _a !== void 0 ? _a : Promise;
}
function isObserver(value) {
    return value && isFunction_1.isFunction(value.next) && isFunction_1.isFunction(value.error) && isFunction_1.isFunction(value.complete);
}
function isSubscriber(value) {
    return (value && value instanceof Subscriber_1.Subscriber) || (isObserver(value) && Subscription_1.isSubscription(value));
}

},{"./Subscriber":12,"./Subscription":13,"./config":14,"./symbol/observable":191,"./util/errorContext":206,"./util/isFunction":212,"./util/pipe":223}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplaySubject = void 0;
var Subject_1 = require("./Subject");
var dateTimestampProvider_1 = require("./scheduler/dateTimestampProvider");
var ReplaySubject = (function (_super) {
    __extends(ReplaySubject, _super);
    function ReplaySubject(_bufferSize, _windowTime, _timestampProvider) {
        if (_bufferSize === void 0) { _bufferSize = Infinity; }
        if (_windowTime === void 0) { _windowTime = Infinity; }
        if (_timestampProvider === void 0) { _timestampProvider = dateTimestampProvider_1.dateTimestampProvider; }
        var _this = _super.call(this) || this;
        _this._bufferSize = _bufferSize;
        _this._windowTime = _windowTime;
        _this._timestampProvider = _timestampProvider;
        _this._buffer = [];
        _this._infiniteTimeWindow = true;
        _this._infiniteTimeWindow = _windowTime === Infinity;
        _this._bufferSize = Math.max(1, _bufferSize);
        _this._windowTime = Math.max(1, _windowTime);
        return _this;
    }
    ReplaySubject.prototype.next = function (value) {
        var _a = this, isStopped = _a.isStopped, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow, _timestampProvider = _a._timestampProvider, _windowTime = _a._windowTime;
        if (!isStopped) {
            _buffer.push(value);
            !_infiniteTimeWindow && _buffer.push(_timestampProvider.now() + _windowTime);
        }
        this._trimBuffer();
        _super.prototype.next.call(this, value);
    };
    ReplaySubject.prototype._subscribe = function (subscriber) {
        this._throwIfClosed();
        this._trimBuffer();
        var subscription = this._innerSubscribe(subscriber);
        var _a = this, _infiniteTimeWindow = _a._infiniteTimeWindow, _buffer = _a._buffer;
        var copy = _buffer.slice();
        for (var i = 0; i < copy.length && !subscriber.closed; i += _infiniteTimeWindow ? 1 : 2) {
            subscriber.next(copy[i]);
        }
        this._checkFinalizedStatuses(subscriber);
        return subscription;
    };
    ReplaySubject.prototype._trimBuffer = function () {
        var _a = this, _bufferSize = _a._bufferSize, _timestampProvider = _a._timestampProvider, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow;
        var adjustedBufferSize = (_infiniteTimeWindow ? 1 : 2) * _bufferSize;
        _bufferSize < Infinity && adjustedBufferSize < _buffer.length && _buffer.splice(0, _buffer.length - adjustedBufferSize);
        if (!_infiniteTimeWindow) {
            var now = _timestampProvider.now();
            var last = 0;
            for (var i = 1; i < _buffer.length && _buffer[i] <= now; i += 2) {
                last = i;
            }
            last && _buffer.splice(0, last + 1);
        }
    };
    return ReplaySubject;
}(Subject_1.Subject));
exports.ReplaySubject = ReplaySubject;

},{"./Subject":11,"./scheduler/dateTimestampProvider":184}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scheduler = void 0;
var dateTimestampProvider_1 = require("./scheduler/dateTimestampProvider");
var Scheduler = (function () {
    function Scheduler(schedulerActionCtor, now) {
        if (now === void 0) { now = Scheduler.now; }
        this.schedulerActionCtor = schedulerActionCtor;
        this.now = now;
    }
    Scheduler.prototype.schedule = function (work, delay, state) {
        if (delay === void 0) { delay = 0; }
        return new this.schedulerActionCtor(this, work).schedule(state, delay);
    };
    Scheduler.now = dateTimestampProvider_1.dateTimestampProvider.now;
    return Scheduler;
}());
exports.Scheduler = Scheduler;

},{"./scheduler/dateTimestampProvider":184}],11:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymousSubject = exports.Subject = void 0;
var Observable_1 = require("./Observable");
var Subscription_1 = require("./Subscription");
var ObjectUnsubscribedError_1 = require("./util/ObjectUnsubscribedError");
var arrRemove_1 = require("./util/arrRemove");
var errorContext_1 = require("./util/errorContext");
var Subject = (function (_super) {
    __extends(Subject, _super);
    function Subject() {
        var _this = _super.call(this) || this;
        _this.closed = false;
        _this.currentObservers = null;
        _this.observers = [];
        _this.isStopped = false;
        _this.hasError = false;
        _this.thrownError = null;
        return _this;
    }
    Subject.prototype.lift = function (operator) {
        var subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
    };
    Subject.prototype._throwIfClosed = function () {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
    };
    Subject.prototype.next = function (value) {
        var _this = this;
        errorContext_1.errorContext(function () {
            var e_1, _a;
            _this._throwIfClosed();
            if (!_this.isStopped) {
                if (!_this.currentObservers) {
                    _this.currentObservers = Array.from(_this.observers);
                }
                try {
                    for (var _b = __values(_this.currentObservers), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var observer = _c.value;
                        observer.next(value);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
        });
    };
    Subject.prototype.error = function (err) {
        var _this = this;
        errorContext_1.errorContext(function () {
            _this._throwIfClosed();
            if (!_this.isStopped) {
                _this.hasError = _this.isStopped = true;
                _this.thrownError = err;
                var observers = _this.observers;
                while (observers.length) {
                    observers.shift().error(err);
                }
            }
        });
    };
    Subject.prototype.complete = function () {
        var _this = this;
        errorContext_1.errorContext(function () {
            _this._throwIfClosed();
            if (!_this.isStopped) {
                _this.isStopped = true;
                var observers = _this.observers;
                while (observers.length) {
                    observers.shift().complete();
                }
            }
        });
    };
    Subject.prototype.unsubscribe = function () {
        this.isStopped = this.closed = true;
        this.observers = this.currentObservers = null;
    };
    Object.defineProperty(Subject.prototype, "observed", {
        get: function () {
            var _a;
            return ((_a = this.observers) === null || _a === void 0 ? void 0 : _a.length) > 0;
        },
        enumerable: false,
        configurable: true
    });
    Subject.prototype._trySubscribe = function (subscriber) {
        this._throwIfClosed();
        return _super.prototype._trySubscribe.call(this, subscriber);
    };
    Subject.prototype._subscribe = function (subscriber) {
        this._throwIfClosed();
        this._checkFinalizedStatuses(subscriber);
        return this._innerSubscribe(subscriber);
    };
    Subject.prototype._innerSubscribe = function (subscriber) {
        var _this = this;
        var _a = this, hasError = _a.hasError, isStopped = _a.isStopped, observers = _a.observers;
        if (hasError || isStopped) {
            return Subscription_1.EMPTY_SUBSCRIPTION;
        }
        this.currentObservers = null;
        observers.push(subscriber);
        return new Subscription_1.Subscription(function () {
            _this.currentObservers = null;
            arrRemove_1.arrRemove(observers, subscriber);
        });
    };
    Subject.prototype._checkFinalizedStatuses = function (subscriber) {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, isStopped = _a.isStopped;
        if (hasError) {
            subscriber.error(thrownError);
        }
        else if (isStopped) {
            subscriber.complete();
        }
    };
    Subject.prototype.asObservable = function () {
        var observable = new Observable_1.Observable();
        observable.source = this;
        return observable;
    };
    Subject.create = function (destination, source) {
        return new AnonymousSubject(destination, source);
    };
    return Subject;
}(Observable_1.Observable));
exports.Subject = Subject;
var AnonymousSubject = (function (_super) {
    __extends(AnonymousSubject, _super);
    function AnonymousSubject(destination, source) {
        var _this = _super.call(this) || this;
        _this.destination = destination;
        _this.source = source;
        return _this;
    }
    AnonymousSubject.prototype.next = function (value) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
    };
    AnonymousSubject.prototype.error = function (err) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
    };
    AnonymousSubject.prototype.complete = function () {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    AnonymousSubject.prototype._subscribe = function (subscriber) {
        var _a, _b;
        return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : Subscription_1.EMPTY_SUBSCRIPTION;
    };
    return AnonymousSubject;
}(Subject));
exports.AnonymousSubject = AnonymousSubject;

},{"./Observable":8,"./Subscription":13,"./util/ObjectUnsubscribedError":197,"./util/arrRemove":203,"./util/errorContext":206}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_OBSERVER = exports.SafeSubscriber = exports.Subscriber = void 0;
var isFunction_1 = require("./util/isFunction");
var Subscription_1 = require("./Subscription");
var config_1 = require("./config");
var reportUnhandledError_1 = require("./util/reportUnhandledError");
var noop_1 = require("./util/noop");
var NotificationFactories_1 = require("./NotificationFactories");
var timeoutProvider_1 = require("./scheduler/timeoutProvider");
var errorContext_1 = require("./util/errorContext");
var Subscriber = (function (_super) {
    __extends(Subscriber, _super);
    function Subscriber(destination) {
        var _this = _super.call(this) || this;
        _this.isStopped = false;
        if (destination) {
            _this.destination = destination;
            if (Subscription_1.isSubscription(destination)) {
                destination.add(_this);
            }
        }
        else {
            _this.destination = exports.EMPTY_OBSERVER;
        }
        return _this;
    }
    Subscriber.create = function (next, error, complete) {
        return new SafeSubscriber(next, error, complete);
    };
    Subscriber.prototype.next = function (value) {
        if (this.isStopped) {
            handleStoppedNotification(NotificationFactories_1.nextNotification(value), this);
        }
        else {
            this._next(value);
        }
    };
    Subscriber.prototype.error = function (err) {
        if (this.isStopped) {
            handleStoppedNotification(NotificationFactories_1.errorNotification(err), this);
        }
        else {
            this.isStopped = true;
            this._error(err);
        }
    };
    Subscriber.prototype.complete = function () {
        if (this.isStopped) {
            handleStoppedNotification(NotificationFactories_1.COMPLETE_NOTIFICATION, this);
        }
        else {
            this.isStopped = true;
            this._complete();
        }
    };
    Subscriber.prototype.unsubscribe = function () {
        if (!this.closed) {
            this.isStopped = true;
            _super.prototype.unsubscribe.call(this);
            this.destination = null;
        }
    };
    Subscriber.prototype._next = function (value) {
        this.destination.next(value);
    };
    Subscriber.prototype._error = function (err) {
        try {
            this.destination.error(err);
        }
        finally {
            this.unsubscribe();
        }
    };
    Subscriber.prototype._complete = function () {
        try {
            this.destination.complete();
        }
        finally {
            this.unsubscribe();
        }
    };
    return Subscriber;
}(Subscription_1.Subscription));
exports.Subscriber = Subscriber;
var _bind = Function.prototype.bind;
function bind(fn, thisArg) {
    return _bind.call(fn, thisArg);
}
var ConsumerObserver = (function () {
    function ConsumerObserver(partialObserver) {
        this.partialObserver = partialObserver;
    }
    ConsumerObserver.prototype.next = function (value) {
        var partialObserver = this.partialObserver;
        if (partialObserver.next) {
            try {
                partialObserver.next(value);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    };
    ConsumerObserver.prototype.error = function (err) {
        var partialObserver = this.partialObserver;
        if (partialObserver.error) {
            try {
                partialObserver.error(err);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
        else {
            handleUnhandledError(err);
        }
    };
    ConsumerObserver.prototype.complete = function () {
        var partialObserver = this.partialObserver;
        if (partialObserver.complete) {
            try {
                partialObserver.complete();
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    };
    return ConsumerObserver;
}());
var SafeSubscriber = (function (_super) {
    __extends(SafeSubscriber, _super);
    function SafeSubscriber(observerOrNext, error, complete) {
        var _this = _super.call(this) || this;
        var partialObserver;
        if (isFunction_1.isFunction(observerOrNext) || !observerOrNext) {
            partialObserver = {
                next: (observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : undefined),
                error: error !== null && error !== void 0 ? error : undefined,
                complete: complete !== null && complete !== void 0 ? complete : undefined,
            };
        }
        else {
            var context_1;
            if (_this && config_1.config.useDeprecatedNextContext) {
                context_1 = Object.create(observerOrNext);
                context_1.unsubscribe = function () { return _this.unsubscribe(); };
                partialObserver = {
                    next: observerOrNext.next && bind(observerOrNext.next, context_1),
                    error: observerOrNext.error && bind(observerOrNext.error, context_1),
                    complete: observerOrNext.complete && bind(observerOrNext.complete, context_1),
                };
            }
            else {
                partialObserver = observerOrNext;
            }
        }
        _this.destination = new ConsumerObserver(partialObserver);
        return _this;
    }
    return SafeSubscriber;
}(Subscriber));
exports.SafeSubscriber = SafeSubscriber;
function handleUnhandledError(error) {
    if (config_1.config.useDeprecatedSynchronousErrorHandling) {
        errorContext_1.captureError(error);
    }
    else {
        reportUnhandledError_1.reportUnhandledError(error);
    }
}
function defaultErrorHandler(err) {
    throw err;
}
function handleStoppedNotification(notification, subscriber) {
    var onStoppedNotification = config_1.config.onStoppedNotification;
    onStoppedNotification && timeoutProvider_1.timeoutProvider.setTimeout(function () { return onStoppedNotification(notification, subscriber); });
}
exports.EMPTY_OBSERVER = {
    closed: true,
    next: noop_1.noop,
    error: defaultErrorHandler,
    complete: noop_1.noop,
};

},{"./NotificationFactories":7,"./Subscription":13,"./config":14,"./scheduler/timeoutProvider":189,"./util/errorContext":206,"./util/isFunction":212,"./util/noop":221,"./util/reportUnhandledError":224}],13:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSubscription = exports.EMPTY_SUBSCRIPTION = exports.Subscription = void 0;
var isFunction_1 = require("./util/isFunction");
var UnsubscriptionError_1 = require("./util/UnsubscriptionError");
var arrRemove_1 = require("./util/arrRemove");
var Subscription = (function () {
    function Subscription(initialTeardown) {
        this.initialTeardown = initialTeardown;
        this.closed = false;
        this._parentage = null;
        this._finalizers = null;
    }
    Subscription.prototype.unsubscribe = function () {
        var e_1, _a, e_2, _b;
        var errors;
        if (!this.closed) {
            this.closed = true;
            var _parentage = this._parentage;
            if (_parentage) {
                this._parentage = null;
                if (Array.isArray(_parentage)) {
                    try {
                        for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                            var parent_1 = _parentage_1_1.value;
                            parent_1.remove(this);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                else {
                    _parentage.remove(this);
                }
            }
            var initialFinalizer = this.initialTeardown;
            if (isFunction_1.isFunction(initialFinalizer)) {
                try {
                    initialFinalizer();
                }
                catch (e) {
                    errors = e instanceof UnsubscriptionError_1.UnsubscriptionError ? e.errors : [e];
                }
            }
            var _finalizers = this._finalizers;
            if (_finalizers) {
                this._finalizers = null;
                try {
                    for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
                        var finalizer = _finalizers_1_1.value;
                        try {
                            execFinalizer(finalizer);
                        }
                        catch (err) {
                            errors = errors !== null && errors !== void 0 ? errors : [];
                            if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
                                errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                            }
                            else {
                                errors.push(err);
                            }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            if (errors) {
                throw new UnsubscriptionError_1.UnsubscriptionError(errors);
            }
        }
    };
    Subscription.prototype.add = function (teardown) {
        var _a;
        if (teardown && teardown !== this) {
            if (this.closed) {
                execFinalizer(teardown);
            }
            else {
                if (teardown instanceof Subscription) {
                    if (teardown.closed || teardown._hasParent(this)) {
                        return;
                    }
                    teardown._addParent(this);
                }
                (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
            }
        }
    };
    Subscription.prototype._hasParent = function (parent) {
        var _parentage = this._parentage;
        return _parentage === parent || (Array.isArray(_parentage) && _parentage.includes(parent));
    };
    Subscription.prototype._addParent = function (parent) {
        var _parentage = this._parentage;
        this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
    };
    Subscription.prototype._removeParent = function (parent) {
        var _parentage = this._parentage;
        if (_parentage === parent) {
            this._parentage = null;
        }
        else if (Array.isArray(_parentage)) {
            arrRemove_1.arrRemove(_parentage, parent);
        }
    };
    Subscription.prototype.remove = function (teardown) {
        var _finalizers = this._finalizers;
        _finalizers && arrRemove_1.arrRemove(_finalizers, teardown);
        if (teardown instanceof Subscription) {
            teardown._removeParent(this);
        }
    };
    Subscription.EMPTY = (function () {
        var empty = new Subscription();
        empty.closed = true;
        return empty;
    })();
    return Subscription;
}());
exports.Subscription = Subscription;
exports.EMPTY_SUBSCRIPTION = Subscription.EMPTY;
function isSubscription(value) {
    return (value instanceof Subscription ||
        (value && 'closed' in value && isFunction_1.isFunction(value.remove) && isFunction_1.isFunction(value.add) && isFunction_1.isFunction(value.unsubscribe)));
}
exports.isSubscription = isSubscription;
function execFinalizer(finalizer) {
    if (isFunction_1.isFunction(finalizer)) {
        finalizer();
    }
    else {
        finalizer.unsubscribe();
    }
}

},{"./util/UnsubscriptionError":199,"./util/arrRemove":203,"./util/isFunction":212}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    onUnhandledError: null,
    onStoppedNotification: null,
    Promise: undefined,
    useDeprecatedSynchronousErrorHandling: false,
    useDeprecatedNextContext: false,
};

},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstValueFrom = void 0;
var EmptyError_1 = require("./util/EmptyError");
var Subscriber_1 = require("./Subscriber");
function firstValueFrom(source, config) {
    var hasConfig = typeof config === 'object';
    return new Promise(function (resolve, reject) {
        var subscriber = new Subscriber_1.SafeSubscriber({
            next: function (value) {
                resolve(value);
                subscriber.unsubscribe();
            },
            error: reject,
            complete: function () {
                if (hasConfig) {
                    resolve(config.defaultValue);
                }
                else {
                    reject(new EmptyError_1.EmptyError());
                }
            },
        });
        source.subscribe(subscriber);
    });
}
exports.firstValueFrom = firstValueFrom;

},{"./Subscriber":12,"./util/EmptyError":194}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastValueFrom = void 0;
var EmptyError_1 = require("./util/EmptyError");
function lastValueFrom(source, config) {
    var hasConfig = typeof config === 'object';
    return new Promise(function (resolve, reject) {
        var _hasValue = false;
        var _value;
        source.subscribe({
            next: function (value) {
                _value = value;
                _hasValue = true;
            },
            error: reject,
            complete: function () {
                if (_hasValue) {
                    resolve(_value);
                }
                else if (hasConfig) {
                    resolve(config.defaultValue);
                }
                else {
                    reject(new EmptyError_1.EmptyError());
                }
            },
        });
    });
}
exports.lastValueFrom = lastValueFrom;

},{"./util/EmptyError":194}],17:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectableObservable = void 0;
var Observable_1 = require("../Observable");
var Subscription_1 = require("../Subscription");
var refCount_1 = require("../operators/refCount");
var OperatorSubscriber_1 = require("../operators/OperatorSubscriber");
var lift_1 = require("../util/lift");
var ConnectableObservable = (function (_super) {
    __extends(ConnectableObservable, _super);
    function ConnectableObservable(source, subjectFactory) {
        var _this = _super.call(this) || this;
        _this.source = source;
        _this.subjectFactory = subjectFactory;
        _this._subject = null;
        _this._refCount = 0;
        _this._connection = null;
        if (lift_1.hasLift(source)) {
            _this.lift = source.lift;
        }
        return _this;
    }
    ConnectableObservable.prototype._subscribe = function (subscriber) {
        return this.getSubject().subscribe(subscriber);
    };
    ConnectableObservable.prototype.getSubject = function () {
        var subject = this._subject;
        if (!subject || subject.isStopped) {
            this._subject = this.subjectFactory();
        }
        return this._subject;
    };
    ConnectableObservable.prototype._teardown = function () {
        this._refCount = 0;
        var _connection = this._connection;
        this._subject = this._connection = null;
        _connection === null || _connection === void 0 ? void 0 : _connection.unsubscribe();
    };
    ConnectableObservable.prototype.connect = function () {
        var _this = this;
        var connection = this._connection;
        if (!connection) {
            connection = this._connection = new Subscription_1.Subscription();
            var subject_1 = this.getSubject();
            connection.add(this.source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subject_1, undefined, function () {
                _this._teardown();
                subject_1.complete();
            }, function (err) {
                _this._teardown();
                subject_1.error(err);
            }, function () { return _this._teardown(); })));
            if (connection.closed) {
                this._connection = null;
                connection = Subscription_1.Subscription.EMPTY;
            }
        }
        return connection;
    };
    ConnectableObservable.prototype.refCount = function () {
        return refCount_1.refCount()(this);
    };
    return ConnectableObservable;
}(Observable_1.Observable));
exports.ConnectableObservable = ConnectableObservable;

},{"../Observable":8,"../Subscription":13,"../operators/OperatorSubscriber":48,"../operators/refCount":118,"../util/lift":219}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindCallback = void 0;
var bindCallbackInternals_1 = require("./bindCallbackInternals");
function bindCallback(callbackFunc, resultSelector, scheduler) {
    return bindCallbackInternals_1.bindCallbackInternals(false, callbackFunc, resultSelector, scheduler);
}
exports.bindCallback = bindCallback;

},{"./bindCallbackInternals":19}],19:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindCallbackInternals = void 0;
var isScheduler_1 = require("../util/isScheduler");
var Observable_1 = require("../Observable");
var subscribeOn_1 = require("../operators/subscribeOn");
var mapOneOrManyArgs_1 = require("../util/mapOneOrManyArgs");
var observeOn_1 = require("../operators/observeOn");
var AsyncSubject_1 = require("../AsyncSubject");
function bindCallbackInternals(isNodeStyle, callbackFunc, resultSelector, scheduler) {
    if (resultSelector) {
        if (isScheduler_1.isScheduler(resultSelector)) {
            scheduler = resultSelector;
        }
        else {
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return bindCallbackInternals(isNodeStyle, callbackFunc, scheduler)
                    .apply(this, args)
                    .pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
            };
        }
    }
    if (scheduler) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return bindCallbackInternals(isNodeStyle, callbackFunc)
                .apply(this, args)
                .pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
        };
    }
    return function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var subject = new AsyncSubject_1.AsyncSubject();
        var uninitialized = true;
        return new Observable_1.Observable(function (subscriber) {
            var subs = subject.subscribe(subscriber);
            if (uninitialized) {
                uninitialized = false;
                var isAsync_1 = false;
                var isComplete_1 = false;
                callbackFunc.apply(_this, __spreadArray(__spreadArray([], __read(args)), [
                    function () {
                        var results = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            results[_i] = arguments[_i];
                        }
                        if (isNodeStyle) {
                            var err = results.shift();
                            if (err != null) {
                                subject.error(err);
                                return;
                            }
                        }
                        subject.next(1 < results.length ? results : results[0]);
                        isComplete_1 = true;
                        if (isAsync_1) {
                            subject.complete();
                        }
                    },
                ]));
                if (isComplete_1) {
                    subject.complete();
                }
                isAsync_1 = true;
            }
            return subs;
        });
    };
}
exports.bindCallbackInternals = bindCallbackInternals;

},{"../AsyncSubject":4,"../Observable":8,"../operators/observeOn":108,"../operators/subscribeOn":136,"../util/isScheduler":218,"../util/mapOneOrManyArgs":220}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindNodeCallback = void 0;
var bindCallbackInternals_1 = require("./bindCallbackInternals");
function bindNodeCallback(callbackFunc, resultSelector, scheduler) {
    return bindCallbackInternals_1.bindCallbackInternals(true, callbackFunc, resultSelector, scheduler);
}
exports.bindNodeCallback = bindNodeCallback;

},{"./bindCallbackInternals":19}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineLatestInit = exports.combineLatest = void 0;
var Observable_1 = require("../Observable");
var argsArgArrayOrObject_1 = require("../util/argsArgArrayOrObject");
var from_1 = require("./from");
var identity_1 = require("../util/identity");
var mapOneOrManyArgs_1 = require("../util/mapOneOrManyArgs");
var args_1 = require("../util/args");
var createObject_1 = require("../util/createObject");
var OperatorSubscriber_1 = require("../operators/OperatorSubscriber");
var executeSchedule_1 = require("../util/executeSchedule");
function combineLatest() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(args);
    var resultSelector = args_1.popResultSelector(args);
    var _a = argsArgArrayOrObject_1.argsArgArrayOrObject(args), observables = _a.args, keys = _a.keys;
    if (observables.length === 0) {
        return from_1.from([], scheduler);
    }
    var result = new Observable_1.Observable(combineLatestInit(observables, scheduler, keys
        ?
            function (values) { return createObject_1.createObject(keys, values); }
        :
            identity_1.identity));
    return resultSelector ? result.pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector)) : result;
}
exports.combineLatest = combineLatest;
function combineLatestInit(observables, scheduler, valueTransform) {
    if (valueTransform === void 0) { valueTransform = identity_1.identity; }
    return function (subscriber) {
        maybeSchedule(scheduler, function () {
            var length = observables.length;
            var values = new Array(length);
            var active = length;
            var remainingFirstValues = length;
            var _loop_1 = function (i) {
                maybeSchedule(scheduler, function () {
                    var source = from_1.from(observables[i], scheduler);
                    var hasFirstValue = false;
                    source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
                        values[i] = value;
                        if (!hasFirstValue) {
                            hasFirstValue = true;
                            remainingFirstValues--;
                        }
                        if (!remainingFirstValues) {
                            subscriber.next(valueTransform(values.slice()));
                        }
                    }, function () {
                        if (!--active) {
                            subscriber.complete();
                        }
                    }));
                }, subscriber);
            };
            for (var i = 0; i < length; i++) {
                _loop_1(i);
            }
        }, subscriber);
    };
}
exports.combineLatestInit = combineLatestInit;
function maybeSchedule(scheduler, execute, subscription) {
    if (scheduler) {
        executeSchedule_1.executeSchedule(subscription, scheduler, execute);
    }
    else {
        execute();
    }
}

},{"../Observable":8,"../operators/OperatorSubscriber":48,"../util/args":200,"../util/argsArgArrayOrObject":201,"../util/createObject":205,"../util/executeSchedule":207,"../util/identity":208,"../util/mapOneOrManyArgs":220,"./from":28}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concat = void 0;
var concatAll_1 = require("../operators/concatAll");
var args_1 = require("../util/args");
var from_1 = require("./from");
function concat() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return concatAll_1.concatAll()(from_1.from(args, args_1.popScheduler(args)));
}
exports.concat = concat;

},{"../operators/concatAll":62,"../util/args":200,"./from":28}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectable = void 0;
var Subject_1 = require("../Subject");
var Observable_1 = require("../Observable");
var defer_1 = require("./defer");
var DEFAULT_CONFIG = {
    connector: function () { return new Subject_1.Subject(); },
    resetOnDisconnect: true,
};
function connectable(source, config) {
    if (config === void 0) { config = DEFAULT_CONFIG; }
    var connection = null;
    var connector = config.connector, _a = config.resetOnDisconnect, resetOnDisconnect = _a === void 0 ? true : _a;
    var subject = connector();
    var result = new Observable_1.Observable(function (subscriber) {
        return subject.subscribe(subscriber);
    });
    result.connect = function () {
        if (!connection || connection.closed) {
            connection = defer_1.defer(function () { return source; }).subscribe(subject);
            if (resetOnDisconnect) {
                connection.add(function () { return (subject = connector()); });
            }
        }
        return connection;
    };
    return result;
}
exports.connectable = connectable;

},{"../Observable":8,"../Subject":11,"./defer":24}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defer = void 0;
var Observable_1 = require("../Observable");
var innerFrom_1 = require("./innerFrom");
function defer(observableFactory) {
    return new Observable_1.Observable(function (subscriber) {
        innerFrom_1.innerFrom(observableFactory()).subscribe(subscriber);
    });
}
exports.defer = defer;

},{"../Observable":8,"./innerFrom":34}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.animationFrames = void 0;
var Observable_1 = require("../../Observable");
var performanceTimestampProvider_1 = require("../../scheduler/performanceTimestampProvider");
var animationFrameProvider_1 = require("../../scheduler/animationFrameProvider");
function animationFrames(timestampProvider) {
    return timestampProvider ? animationFramesFactory(timestampProvider) : DEFAULT_ANIMATION_FRAMES;
}
exports.animationFrames = animationFrames;
function animationFramesFactory(timestampProvider) {
    return new Observable_1.Observable(function (subscriber) {
        var provider = timestampProvider || performanceTimestampProvider_1.performanceTimestampProvider;
        var start = provider.now();
        var id = 0;
        var run = function () {
            if (!subscriber.closed) {
                id = animationFrameProvider_1.animationFrameProvider.requestAnimationFrame(function (timestamp) {
                    id = 0;
                    var now = provider.now();
                    subscriber.next({
                        timestamp: timestampProvider ? now : timestamp,
                        elapsed: now - start,
                    });
                    run();
                });
            }
        };
        run();
        return function () {
            if (id) {
                animationFrameProvider_1.animationFrameProvider.cancelAnimationFrame(id);
            }
        };
    });
}
var DEFAULT_ANIMATION_FRAMES = animationFramesFactory();

},{"../../Observable":8,"../../scheduler/animationFrameProvider":181,"../../scheduler/performanceTimestampProvider":187}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.empty = exports.EMPTY = void 0;
var Observable_1 = require("../Observable");
exports.EMPTY = new Observable_1.Observable(function (subscriber) { return subscriber.complete(); });
function empty(scheduler) {
    return scheduler ? emptyScheduled(scheduler) : exports.EMPTY;
}
exports.empty = empty;
function emptyScheduled(scheduler) {
    return new Observable_1.Observable(function (subscriber) { return scheduler.schedule(function () { return subscriber.complete(); }); });
}

},{"../Observable":8}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forkJoin = void 0;
var Observable_1 = require("../Observable");
var argsArgArrayOrObject_1 = require("../util/argsArgArrayOrObject");
var innerFrom_1 = require("./innerFrom");
var args_1 = require("../util/args");
var OperatorSubscriber_1 = require("../operators/OperatorSubscriber");
var mapOneOrManyArgs_1 = require("../util/mapOneOrManyArgs");
var createObject_1 = require("../util/createObject");
function forkJoin() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var resultSelector = args_1.popResultSelector(args);
    var _a = argsArgArrayOrObject_1.argsArgArrayOrObject(args), sources = _a.args, keys = _a.keys;
    var result = new Observable_1.Observable(function (subscriber) {
        var length = sources.length;
        if (!length) {
            subscriber.complete();
            return;
        }
        var values = new Array(length);
        var remainingCompletions = length;
        var remainingEmissions = length;
        var _loop_1 = function (sourceIndex) {
            var hasValue = false;
            innerFrom_1.innerFrom(sources[sourceIndex]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
                if (!hasValue) {
                    hasValue = true;
                    remainingEmissions--;
                }
                values[sourceIndex] = value;
            }, function () { return remainingCompletions--; }, undefined, function () {
                if (!remainingCompletions || !hasValue) {
                    if (!remainingEmissions) {
                        subscriber.next(keys ? createObject_1.createObject(keys, values) : values);
                    }
                    subscriber.complete();
                }
            }));
        };
        for (var sourceIndex = 0; sourceIndex < length; sourceIndex++) {
            _loop_1(sourceIndex);
        }
    });
    return resultSelector ? result.pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector)) : result;
}
exports.forkJoin = forkJoin;

},{"../Observable":8,"../operators/OperatorSubscriber":48,"../util/args":200,"../util/argsArgArrayOrObject":201,"../util/createObject":205,"../util/mapOneOrManyArgs":220,"./innerFrom":34}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.from = void 0;
var scheduled_1 = require("../scheduled/scheduled");
var innerFrom_1 = require("./innerFrom");
function from(input, scheduler) {
    return scheduler ? scheduled_1.scheduled(input, scheduler) : innerFrom_1.innerFrom(input);
}
exports.from = from;

},{"../scheduled/scheduled":169,"./innerFrom":34}],29:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromEvent = void 0;
var innerFrom_1 = require("../observable/innerFrom");
var Observable_1 = require("../Observable");
var mergeMap_1 = require("../operators/mergeMap");
var isArrayLike_1 = require("../util/isArrayLike");
var isFunction_1 = require("../util/isFunction");
var mapOneOrManyArgs_1 = require("../util/mapOneOrManyArgs");
var nodeEventEmitterMethods = ['addListener', 'removeListener'];
var eventTargetMethods = ['addEventListener', 'removeEventListener'];
var jqueryMethods = ['on', 'off'];
function fromEvent(target, eventName, options, resultSelector) {
    if (isFunction_1.isFunction(options)) {
        resultSelector = options;
        options = undefined;
    }
    if (resultSelector) {
        return fromEvent(target, eventName, options).pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
    }
    var _a = __read(isEventTarget(target)
        ? eventTargetMethods.map(function (methodName) { return function (handler) { return target[methodName](eventName, handler, options); }; })
        :
            isNodeStyleEventEmitter(target)
                ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(target, eventName))
                : isJQueryStyleEventEmitter(target)
                    ? jqueryMethods.map(toCommonHandlerRegistry(target, eventName))
                    : [], 2), add = _a[0], remove = _a[1];
    if (!add) {
        if (isArrayLike_1.isArrayLike(target)) {
            return mergeMap_1.mergeMap(function (subTarget) { return fromEvent(subTarget, eventName, options); })(innerFrom_1.innerFrom(target));
        }
    }
    if (!add) {
        throw new TypeError('Invalid event target');
    }
    return new Observable_1.Observable(function (subscriber) {
        var handler = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return subscriber.next(1 < args.length ? args : args[0]);
        };
        add(handler);
        return function () { return remove(handler); };
    });
}
exports.fromEvent = fromEvent;
function toCommonHandlerRegistry(target, eventName) {
    return function (methodName) { return function (handler) { return target[methodName](eventName, handler); }; };
}
function isNodeStyleEventEmitter(target) {
    return isFunction_1.isFunction(target.addListener) && isFunction_1.isFunction(target.removeListener);
}
function isJQueryStyleEventEmitter(target) {
    return isFunction_1.isFunction(target.on) && isFunction_1.isFunction(target.off);
}
function isEventTarget(target) {
    return isFunction_1.isFunction(target.addEventListener) && isFunction_1.isFunction(target.removeEventListener);
}

},{"../Observable":8,"../observable/innerFrom":34,"../operators/mergeMap":102,"../util/isArrayLike":209,"../util/isFunction":212,"../util/mapOneOrManyArgs":220}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromEventPattern = void 0;
var Observable_1 = require("../Observable");
var isFunction_1 = require("../util/isFunction");
var mapOneOrManyArgs_1 = require("../util/mapOneOrManyArgs");
function fromEventPattern(addHandler, removeHandler, resultSelector) {
    if (resultSelector) {
        return fromEventPattern(addHandler, removeHandler).pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
    }
    return new Observable_1.Observable(function (subscriber) {
        var handler = function () {
            var e = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                e[_i] = arguments[_i];
            }
            return subscriber.next(e.length === 1 ? e[0] : e);
        };
        var retValue = addHandler(handler);
        return isFunction_1.isFunction(removeHandler) ? function () { return removeHandler(handler, retValue); } : undefined;
    });
}
exports.fromEventPattern = fromEventPattern;

},{"../Observable":8,"../util/isFunction":212,"../util/mapOneOrManyArgs":220}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromSubscribable = void 0;
var Observable_1 = require("../Observable");
function fromSubscribable(subscribable) {
    return new Observable_1.Observable(function (subscriber) { return subscribable.subscribe(subscriber); });
}
exports.fromSubscribable = fromSubscribable;

},{"../Observable":8}],32:[function(require,module,exports){
"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
var identity_1 = require("../util/identity");
var isScheduler_1 = require("../util/isScheduler");
var defer_1 = require("./defer");
var scheduleIterable_1 = require("../scheduled/scheduleIterable");
function generate(initialStateOrOptions, condition, iterate, resultSelectorOrScheduler, scheduler) {
    var _a, _b;
    var resultSelector;
    var initialState;
    if (arguments.length === 1) {
        (_a = initialStateOrOptions, initialState = _a.initialState, condition = _a.condition, iterate = _a.iterate, _b = _a.resultSelector, resultSelector = _b === void 0 ? identity_1.identity : _b, scheduler = _a.scheduler);
    }
    else {
        initialState = initialStateOrOptions;
        if (!resultSelectorOrScheduler || isScheduler_1.isScheduler(resultSelectorOrScheduler)) {
            resultSelector = identity_1.identity;
            scheduler = resultSelectorOrScheduler;
        }
        else {
            resultSelector = resultSelectorOrScheduler;
        }
    }
    function gen() {
        var state;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    state = initialState;
                    _a.label = 1;
                case 1:
                    if (!(!condition || condition(state))) return [3, 4];
                    return [4, resultSelector(state)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    state = iterate(state);
                    return [3, 1];
                case 4: return [2];
            }
        });
    }
    return defer_1.defer((scheduler
        ?
            function () { return scheduleIterable_1.scheduleIterable(gen(), scheduler); }
        :
            gen));
}
exports.generate = generate;

},{"../scheduled/scheduleIterable":165,"../util/identity":208,"../util/isScheduler":218,"./defer":24}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iif = void 0;
var defer_1 = require("./defer");
function iif(condition, trueResult, falseResult) {
    return defer_1.defer(function () { return (condition() ? trueResult : falseResult); });
}
exports.iif = iif;

},{"./defer":24}],34:[function(require,module,exports){
(function (process){(function (){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromReadableStreamLike = exports.fromAsyncIterable = exports.fromIterable = exports.fromPromise = exports.fromArrayLike = exports.fromInteropObservable = exports.innerFrom = void 0;
var isArrayLike_1 = require("../util/isArrayLike");
var isPromise_1 = require("../util/isPromise");
var Observable_1 = require("../Observable");
var isInteropObservable_1 = require("../util/isInteropObservable");
var isAsyncIterable_1 = require("../util/isAsyncIterable");
var throwUnobservableError_1 = require("../util/throwUnobservableError");
var isIterable_1 = require("../util/isIterable");
var isReadableStreamLike_1 = require("../util/isReadableStreamLike");
var isFunction_1 = require("../util/isFunction");
var reportUnhandledError_1 = require("../util/reportUnhandledError");
var observable_1 = require("../symbol/observable");
function innerFrom(input) {
    if (input instanceof Observable_1.Observable) {
        return input;
    }
    if (input != null) {
        if (isInteropObservable_1.isInteropObservable(input)) {
            return fromInteropObservable(input);
        }
        if (isArrayLike_1.isArrayLike(input)) {
            return fromArrayLike(input);
        }
        if (isPromise_1.isPromise(input)) {
            return fromPromise(input);
        }
        if (isAsyncIterable_1.isAsyncIterable(input)) {
            return fromAsyncIterable(input);
        }
        if (isIterable_1.isIterable(input)) {
            return fromIterable(input);
        }
        if (isReadableStreamLike_1.isReadableStreamLike(input)) {
            return fromReadableStreamLike(input);
        }
    }
    throw throwUnobservableError_1.createInvalidObservableTypeError(input);
}
exports.innerFrom = innerFrom;
function fromInteropObservable(obj) {
    return new Observable_1.Observable(function (subscriber) {
        var obs = obj[observable_1.observable]();
        if (isFunction_1.isFunction(obs.subscribe)) {
            return obs.subscribe(subscriber);
        }
        throw new TypeError('Provided object does not correctly implement Symbol.observable');
    });
}
exports.fromInteropObservable = fromInteropObservable;
function fromArrayLike(array) {
    return new Observable_1.Observable(function (subscriber) {
        for (var i = 0; i < array.length && !subscriber.closed; i++) {
            subscriber.next(array[i]);
        }
        subscriber.complete();
    });
}
exports.fromArrayLike = fromArrayLike;
function fromPromise(promise) {
    return new Observable_1.Observable(function (subscriber) {
        promise
            .then(function (value) {
            if (!subscriber.closed) {
                subscriber.next(value);
                subscriber.complete();
            }
        }, function (err) { return subscriber.error(err); })
            .then(null, reportUnhandledError_1.reportUnhandledError);
    });
}
exports.fromPromise = fromPromise;
function fromIterable(iterable) {
    return new Observable_1.Observable(function (subscriber) {
        var e_1, _a;
        try {
            for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
                var value = iterable_1_1.value;
                subscriber.next(value);
                if (subscriber.closed) {
                    return;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        subscriber.complete();
    });
}
exports.fromIterable = fromIterable;
function fromAsyncIterable(asyncIterable) {
    return new Observable_1.Observable(function (subscriber) {
        process(asyncIterable, subscriber).catch(function (err) { return subscriber.error(err); });
    });
}
exports.fromAsyncIterable = fromAsyncIterable;
function fromReadableStreamLike(readableStream) {
    return fromAsyncIterable(isReadableStreamLike_1.readableStreamLikeToAsyncGenerator(readableStream));
}
exports.fromReadableStreamLike = fromReadableStreamLike;
function process(asyncIterable, subscriber) {
    var asyncIterable_1, asyncIterable_1_1;
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function () {
        var value, e_2_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, 6, 11]);
                    asyncIterable_1 = __asyncValues(asyncIterable);
                    _b.label = 1;
                case 1: return [4, asyncIterable_1.next()];
                case 2:
                    if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
                    value = asyncIterable_1_1.value;
                    subscriber.next(value);
                    if (subscriber.closed) {
                        return [2];
                    }
                    _b.label = 3;
                case 3: return [3, 1];
                case 4: return [3, 11];
                case 5:
                    e_2_1 = _b.sent();
                    e_2 = { error: e_2_1 };
                    return [3, 11];
                case 6:
                    _b.trys.push([6, , 9, 10]);
                    if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
                    return [4, _a.call(asyncIterable_1)];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8: return [3, 10];
                case 9:
                    if (e_2) throw e_2.error;
                    return [7];
                case 10: return [7];
                case 11:
                    subscriber.complete();
                    return [2];
            }
        });
    });
}

}).call(this)}).call(this,require('_process'))
},{"../Observable":8,"../symbol/observable":191,"../util/isArrayLike":209,"../util/isAsyncIterable":210,"../util/isFunction":212,"../util/isInteropObservable":213,"../util/isIterable":214,"../util/isPromise":216,"../util/isReadableStreamLike":217,"../util/reportUnhandledError":224,"../util/throwUnobservableError":225,"_process":1}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interval = void 0;
var async_1 = require("../scheduler/async");
var timer_1 = require("./timer");
function interval(period, scheduler) {
    if (period === void 0) { period = 0; }
    if (scheduler === void 0) { scheduler = async_1.asyncScheduler; }
    if (period < 0) {
        period = 0;
    }
    return timer_1.timer(period, period, scheduler);
}
exports.interval = interval;

},{"../scheduler/async":183,"./timer":45}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merge = void 0;
var mergeAll_1 = require("../operators/mergeAll");
var innerFrom_1 = require("./innerFrom");
var empty_1 = require("./empty");
var args_1 = require("../util/args");
var from_1 = require("./from");
function merge() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(args);
    var concurrent = args_1.popNumber(args, Infinity);
    var sources = args;
    return !sources.length
        ?
            empty_1.EMPTY
        : sources.length === 1
            ?
                innerFrom_1.innerFrom(sources[0])
            :
                mergeAll_1.mergeAll(concurrent)(from_1.from(sources, scheduler));
}
exports.merge = merge;

},{"../operators/mergeAll":100,"../util/args":200,"./empty":26,"./from":28,"./innerFrom":34}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.never = exports.NEVER = void 0;
var Observable_1 = require("../Observable");
var noop_1 = require("../util/noop");
exports.NEVER = new Observable_1.Observable(noop_1.noop);
function never() {
    return exports.NEVER;
}
exports.never = never;

},{"../Observable":8,"../util/noop":221}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.of = void 0;
var args_1 = require("../util/args");
var from_1 = require("./from");
function of() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(args);
    return from_1.from(args, scheduler);
}
exports.of = of;

},{"../util/args":200,"./from":28}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onErrorResumeNext = void 0;
var Observable_1 = require("../Observable");
var argsOrArgArray_1 = require("../util/argsOrArgArray");
var OperatorSubscriber_1 = require("../operators/OperatorSubscriber");
var noop_1 = require("../util/noop");
var innerFrom_1 = require("./innerFrom");
function onErrorResumeNext() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    var nextSources = argsOrArgArray_1.argsOrArgArray(sources);
    return new Observable_1.Observable(function (subscriber) {
        var sourceIndex = 0;
        var subscribeNext = function () {
            if (sourceIndex < nextSources.length) {
                var nextSource = void 0;
                try {
                    nextSource = innerFrom_1.innerFrom(nextSources[sourceIndex++]);
                }
                catch (err) {
                    subscribeNext();
                    return;
                }
                var innerSubscriber = new OperatorSubscriber_1.OperatorSubscriber(subscriber, undefined, noop_1.noop, noop_1.noop);
                nextSource.subscribe(innerSubscriber);
                innerSubscriber.add(subscribeNext);
            }
            else {
                subscriber.complete();
            }
        };
        subscribeNext();
    });
}
exports.onErrorResumeNext = onErrorResumeNext;

},{"../Observable":8,"../operators/OperatorSubscriber":48,"../util/argsOrArgArray":202,"../util/noop":221,"./innerFrom":34}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pairs = void 0;
var from_1 = require("./from");
function pairs(obj, scheduler) {
    return from_1.from(Object.entries(obj), scheduler);
}
exports.pairs = pairs;

},{"./from":28}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partition = void 0;
var not_1 = require("../util/not");
var filter_1 = require("../operators/filter");
var innerFrom_1 = require("./innerFrom");
function partition(source, predicate, thisArg) {
    return [filter_1.filter(predicate, thisArg)(innerFrom_1.innerFrom(source)), filter_1.filter(not_1.not(predicate, thisArg))(innerFrom_1.innerFrom(source))];
}
exports.partition = partition;

},{"../operators/filter":84,"../util/not":222,"./innerFrom":34}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.raceInit = exports.race = void 0;
var Observable_1 = require("../Observable");
var innerFrom_1 = require("./innerFrom");
var argsOrArgArray_1 = require("../util/argsOrArgArray");
var OperatorSubscriber_1 = require("../operators/OperatorSubscriber");
function race() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    sources = argsOrArgArray_1.argsOrArgArray(sources);
    return sources.length === 1 ? innerFrom_1.innerFrom(sources[0]) : new Observable_1.Observable(raceInit(sources));
}
exports.race = race;
function raceInit(sources) {
    return function (subscriber) {
        var subscriptions = [];
        var _loop_1 = function (i) {
            subscriptions.push(innerFrom_1.innerFrom(sources[i]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
                if (subscriptions) {
                    for (var s = 0; s < subscriptions.length; s++) {
                        s !== i && subscriptions[s].unsubscribe();
                    }
                    subscriptions = null;
                }
                subscriber.next(value);
            })));
        };
        for (var i = 0; subscriptions && !subscriber.closed && i < sources.length; i++) {
            _loop_1(i);
        }
    };
}
exports.raceInit = raceInit;

},{"../Observable":8,"../operators/OperatorSubscriber":48,"../util/argsOrArgArray":202,"./innerFrom":34}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.range = void 0;
var Observable_1 = require("../Observable");
var empty_1 = require("./empty");
function range(start, count, scheduler) {
    if (count == null) {
        count = start;
        start = 0;
    }
    if (count <= 0) {
        return empty_1.EMPTY;
    }
    var end = count + start;
    return new Observable_1.Observable(scheduler
        ?
            function (subscriber) {
                var n = start;
                return scheduler.schedule(function () {
                    if (n < end) {
                        subscriber.next(n++);
                        this.schedule();
                    }
                    else {
                        subscriber.complete();
                    }
                });
            }
        :
            function (subscriber) {
                var n = start;
                while (n < end && !subscriber.closed) {
                    subscriber.next(n++);
                }
                subscriber.complete();
            });
}
exports.range = range;

},{"../Observable":8,"./empty":26}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = void 0;
var Observable_1 = require("../Observable");
var isFunction_1 = require("../util/isFunction");
function throwError(errorOrErrorFactory, scheduler) {
    var errorFactory = isFunction_1.isFunction(errorOrErrorFactory) ? errorOrErrorFactory : function () { return errorOrErrorFactory; };
    var init = function (subscriber) { return subscriber.error(errorFactory()); };
    return new Observable_1.Observable(scheduler ? function (subscriber) { return scheduler.schedule(init, 0, subscriber); } : init);
}
exports.throwError = throwError;

},{"../Observable":8,"../util/isFunction":212}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timer = void 0;
var Observable_1 = require("../Observable");
var async_1 = require("../scheduler/async");
var isScheduler_1 = require("../util/isScheduler");
var isDate_1 = require("../util/isDate");
function timer(dueTime, intervalOrScheduler, scheduler) {
    if (dueTime === void 0) { dueTime = 0; }
    if (scheduler === void 0) { scheduler = async_1.async; }
    var intervalDuration = -1;
    if (intervalOrScheduler != null) {
        if (isScheduler_1.isScheduler(intervalOrScheduler)) {
            scheduler = intervalOrScheduler;
        }
        else {
            intervalDuration = intervalOrScheduler;
        }
    }
    return new Observable_1.Observable(function (subscriber) {
        var due = isDate_1.isValidDate(dueTime) ? +dueTime - scheduler.now() : dueTime;
        if (due < 0) {
            due = 0;
        }
        var n = 0;
        return scheduler.schedule(function () {
            if (!subscriber.closed) {
                subscriber.next(n++);
                if (0 <= intervalDuration) {
                    this.schedule(undefined, intervalDuration);
                }
                else {
                    subscriber.complete();
                }
            }
        }, due);
    });
}
exports.timer = timer;

},{"../Observable":8,"../scheduler/async":183,"../util/isDate":211,"../util/isScheduler":218}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.using = void 0;
var Observable_1 = require("../Observable");
var innerFrom_1 = require("./innerFrom");
var empty_1 = require("./empty");
function using(resourceFactory, observableFactory) {
    return new Observable_1.Observable(function (subscriber) {
        var resource = resourceFactory();
        var result = observableFactory(resource);
        var source = result ? innerFrom_1.innerFrom(result) : empty_1.EMPTY;
        source.subscribe(subscriber);
        return function () {
            if (resource) {
                resource.unsubscribe();
            }
        };
    });
}
exports.using = using;

},{"../Observable":8,"./empty":26,"./innerFrom":34}],47:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zip = void 0;
var Observable_1 = require("../Observable");
var innerFrom_1 = require("./innerFrom");
var argsOrArgArray_1 = require("../util/argsOrArgArray");
var empty_1 = require("./empty");
var OperatorSubscriber_1 = require("../operators/OperatorSubscriber");
var args_1 = require("../util/args");
function zip() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var resultSelector = args_1.popResultSelector(args);
    var sources = argsOrArgArray_1.argsOrArgArray(args);
    return sources.length
        ? new Observable_1.Observable(function (subscriber) {
            var buffers = sources.map(function () { return []; });
            var completed = sources.map(function () { return false; });
            subscriber.add(function () {
                buffers = completed = null;
            });
            var _loop_1 = function (sourceIndex) {
                innerFrom_1.innerFrom(sources[sourceIndex]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
                    buffers[sourceIndex].push(value);
                    if (buffers.every(function (buffer) { return buffer.length; })) {
                        var result = buffers.map(function (buffer) { return buffer.shift(); });
                        subscriber.next(resultSelector ? resultSelector.apply(void 0, __spreadArray([], __read(result))) : result);
                        if (buffers.some(function (buffer, i) { return !buffer.length && completed[i]; })) {
                            subscriber.complete();
                        }
                    }
                }, function () {
                    completed[sourceIndex] = true;
                    !buffers[sourceIndex].length && subscriber.complete();
                }));
            };
            for (var sourceIndex = 0; !subscriber.closed && sourceIndex < sources.length; sourceIndex++) {
                _loop_1(sourceIndex);
            }
            return function () {
                buffers = completed = null;
            };
        })
        : empty_1.EMPTY;
}
exports.zip = zip;

},{"../Observable":8,"../operators/OperatorSubscriber":48,"../util/args":200,"../util/argsOrArgArray":202,"./empty":26,"./innerFrom":34}],48:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorSubscriber = exports.createOperatorSubscriber = void 0;
var Subscriber_1 = require("../Subscriber");
function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
    return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}
exports.createOperatorSubscriber = createOperatorSubscriber;
var OperatorSubscriber = (function (_super) {
    __extends(OperatorSubscriber, _super);
    function OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
        var _this = _super.call(this, destination) || this;
        _this.onFinalize = onFinalize;
        _this.shouldUnsubscribe = shouldUnsubscribe;
        _this._next = onNext
            ? function (value) {
                try {
                    onNext(value);
                }
                catch (err) {
                    destination.error(err);
                }
            }
            : _super.prototype._next;
        _this._error = onError
            ? function (err) {
                try {
                    onError(err);
                }
                catch (err) {
                    destination.error(err);
                }
                finally {
                    this.unsubscribe();
                }
            }
            : _super.prototype._error;
        _this._complete = onComplete
            ? function () {
                try {
                    onComplete();
                }
                catch (err) {
                    destination.error(err);
                }
                finally {
                    this.unsubscribe();
                }
            }
            : _super.prototype._complete;
        return _this;
    }
    OperatorSubscriber.prototype.unsubscribe = function () {
        var _a;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
            var closed_1 = this.closed;
            _super.prototype.unsubscribe.call(this);
            !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
        }
    };
    return OperatorSubscriber;
}(Subscriber_1.Subscriber));
exports.OperatorSubscriber = OperatorSubscriber;

},{"../Subscriber":12}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audit = void 0;
var lift_1 = require("../util/lift");
var innerFrom_1 = require("../observable/innerFrom");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function audit(durationSelector) {
    return lift_1.operate(function (source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        var durationSubscriber = null;
        var isComplete = false;
        var endDuration = function () {
            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
            durationSubscriber = null;
            if (hasValue) {
                hasValue = false;
                var value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
            isComplete && subscriber.complete();
        };
        var cleanupDuration = function () {
            durationSubscriber = null;
            isComplete && subscriber.complete();
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            lastValue = value;
            if (!durationSubscriber) {
                innerFrom_1.innerFrom(durationSelector(value)).subscribe((durationSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, endDuration, cleanupDuration)));
            }
        }, function () {
            isComplete = true;
            (!hasValue || !durationSubscriber || durationSubscriber.closed) && subscriber.complete();
        }));
    });
}
exports.audit = audit;

},{"../observable/innerFrom":34,"../util/lift":219,"./OperatorSubscriber":48}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditTime = void 0;
var async_1 = require("../scheduler/async");
var audit_1 = require("./audit");
var timer_1 = require("../observable/timer");
function auditTime(duration, scheduler) {
    if (scheduler === void 0) { scheduler = async_1.asyncScheduler; }
    return audit_1.audit(function () { return timer_1.timer(duration, scheduler); });
}
exports.auditTime = auditTime;

},{"../observable/timer":45,"../scheduler/async":183,"./audit":49}],51:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buffer = void 0;
var lift_1 = require("../util/lift");
var noop_1 = require("../util/noop");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
function buffer(closingNotifier) {
    return lift_1.operate(function (source, subscriber) {
        var currentBuffer = [];
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) { return currentBuffer.push(value); }, function () {
            subscriber.next(currentBuffer);
            subscriber.complete();
        }));
        innerFrom_1.innerFrom(closingNotifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () {
            var b = currentBuffer;
            currentBuffer = [];
            subscriber.next(b);
        }, noop_1.noop));
        return function () {
            currentBuffer = null;
        };
    });
}
exports.buffer = buffer;

},{"../observable/innerFrom":34,"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],52:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferCount = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var arrRemove_1 = require("../util/arrRemove");
function bufferCount(bufferSize, startBufferEvery) {
    if (startBufferEvery === void 0) { startBufferEvery = null; }
    startBufferEvery = startBufferEvery !== null && startBufferEvery !== void 0 ? startBufferEvery : bufferSize;
    return lift_1.operate(function (source, subscriber) {
        var buffers = [];
        var count = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var e_1, _a, e_2, _b;
            var toEmit = null;
            if (count++ % startBufferEvery === 0) {
                buffers.push([]);
            }
            try {
                for (var buffers_1 = __values(buffers), buffers_1_1 = buffers_1.next(); !buffers_1_1.done; buffers_1_1 = buffers_1.next()) {
                    var buffer = buffers_1_1.value;
                    buffer.push(value);
                    if (bufferSize <= buffer.length) {
                        toEmit = toEmit !== null && toEmit !== void 0 ? toEmit : [];
                        toEmit.push(buffer);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (buffers_1_1 && !buffers_1_1.done && (_a = buffers_1.return)) _a.call(buffers_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (toEmit) {
                try {
                    for (var toEmit_1 = __values(toEmit), toEmit_1_1 = toEmit_1.next(); !toEmit_1_1.done; toEmit_1_1 = toEmit_1.next()) {
                        var buffer = toEmit_1_1.value;
                        arrRemove_1.arrRemove(buffers, buffer);
                        subscriber.next(buffer);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (toEmit_1_1 && !toEmit_1_1.done && (_b = toEmit_1.return)) _b.call(toEmit_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }, function () {
            var e_3, _a;
            try {
                for (var buffers_2 = __values(buffers), buffers_2_1 = buffers_2.next(); !buffers_2_1.done; buffers_2_1 = buffers_2.next()) {
                    var buffer = buffers_2_1.value;
                    subscriber.next(buffer);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (buffers_2_1 && !buffers_2_1.done && (_a = buffers_2.return)) _a.call(buffers_2);
                }
                finally { if (e_3) throw e_3.error; }
            }
            subscriber.complete();
        }, undefined, function () {
            buffers = null;
        }));
    });
}
exports.bufferCount = bufferCount;

},{"../util/arrRemove":203,"../util/lift":219,"./OperatorSubscriber":48}],53:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferTime = void 0;
var Subscription_1 = require("../Subscription");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var arrRemove_1 = require("../util/arrRemove");
var async_1 = require("../scheduler/async");
var args_1 = require("../util/args");
var executeSchedule_1 = require("../util/executeSchedule");
function bufferTime(bufferTimeSpan) {
    var _a, _b;
    var otherArgs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        otherArgs[_i - 1] = arguments[_i];
    }
    var scheduler = (_a = args_1.popScheduler(otherArgs)) !== null && _a !== void 0 ? _a : async_1.asyncScheduler;
    var bufferCreationInterval = (_b = otherArgs[0]) !== null && _b !== void 0 ? _b : null;
    var maxBufferSize = otherArgs[1] || Infinity;
    return lift_1.operate(function (source, subscriber) {
        var bufferRecords = [];
        var restartOnEmit = false;
        var emit = function (record) {
            var buffer = record.buffer, subs = record.subs;
            subs.unsubscribe();
            arrRemove_1.arrRemove(bufferRecords, record);
            subscriber.next(buffer);
            restartOnEmit && startBuffer();
        };
        var startBuffer = function () {
            if (bufferRecords) {
                var subs = new Subscription_1.Subscription();
                subscriber.add(subs);
                var buffer = [];
                var record_1 = {
                    buffer: buffer,
                    subs: subs,
                };
                bufferRecords.push(record_1);
                executeSchedule_1.executeSchedule(subs, scheduler, function () { return emit(record_1); }, bufferTimeSpan);
            }
        };
        if (bufferCreationInterval !== null && bufferCreationInterval >= 0) {
            executeSchedule_1.executeSchedule(subscriber, scheduler, startBuffer, bufferCreationInterval, true);
        }
        else {
            restartOnEmit = true;
        }
        startBuffer();
        var bufferTimeSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var e_1, _a;
            var recordsCopy = bufferRecords.slice();
            try {
                for (var recordsCopy_1 = __values(recordsCopy), recordsCopy_1_1 = recordsCopy_1.next(); !recordsCopy_1_1.done; recordsCopy_1_1 = recordsCopy_1.next()) {
                    var record = recordsCopy_1_1.value;
                    var buffer = record.buffer;
                    buffer.push(value);
                    maxBufferSize <= buffer.length && emit(record);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (recordsCopy_1_1 && !recordsCopy_1_1.done && (_a = recordsCopy_1.return)) _a.call(recordsCopy_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }, function () {
            while (bufferRecords === null || bufferRecords === void 0 ? void 0 : bufferRecords.length) {
                subscriber.next(bufferRecords.shift().buffer);
            }
            bufferTimeSubscriber === null || bufferTimeSubscriber === void 0 ? void 0 : bufferTimeSubscriber.unsubscribe();
            subscriber.complete();
            subscriber.unsubscribe();
        }, undefined, function () { return (bufferRecords = null); });
        source.subscribe(bufferTimeSubscriber);
    });
}
exports.bufferTime = bufferTime;

},{"../Subscription":13,"../scheduler/async":183,"../util/args":200,"../util/arrRemove":203,"../util/executeSchedule":207,"../util/lift":219,"./OperatorSubscriber":48}],54:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferToggle = void 0;
var Subscription_1 = require("../Subscription");
var lift_1 = require("../util/lift");
var innerFrom_1 = require("../observable/innerFrom");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var noop_1 = require("../util/noop");
var arrRemove_1 = require("../util/arrRemove");
function bufferToggle(openings, closingSelector) {
    return lift_1.operate(function (source, subscriber) {
        var buffers = [];
        innerFrom_1.innerFrom(openings).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (openValue) {
            var buffer = [];
            buffers.push(buffer);
            var closingSubscription = new Subscription_1.Subscription();
            var emitBuffer = function () {
                arrRemove_1.arrRemove(buffers, buffer);
                subscriber.next(buffer);
                closingSubscription.unsubscribe();
            };
            closingSubscription.add(innerFrom_1.innerFrom(closingSelector(openValue)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, emitBuffer, noop_1.noop)));
        }, noop_1.noop));
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var e_1, _a;
            try {
                for (var buffers_1 = __values(buffers), buffers_1_1 = buffers_1.next(); !buffers_1_1.done; buffers_1_1 = buffers_1.next()) {
                    var buffer = buffers_1_1.value;
                    buffer.push(value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (buffers_1_1 && !buffers_1_1.done && (_a = buffers_1.return)) _a.call(buffers_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }, function () {
            while (buffers.length > 0) {
                subscriber.next(buffers.shift());
            }
            subscriber.complete();
        }));
    });
}
exports.bufferToggle = bufferToggle;

},{"../Subscription":13,"../observable/innerFrom":34,"../util/arrRemove":203,"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],55:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferWhen = void 0;
var lift_1 = require("../util/lift");
var noop_1 = require("../util/noop");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
function bufferWhen(closingSelector) {
    return lift_1.operate(function (source, subscriber) {
        var buffer = null;
        var closingSubscriber = null;
        var openBuffer = function () {
            closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
            var b = buffer;
            buffer = [];
            b && subscriber.next(b);
            innerFrom_1.innerFrom(closingSelector()).subscribe((closingSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, openBuffer, noop_1.noop)));
        };
        openBuffer();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) { return buffer === null || buffer === void 0 ? void 0 : buffer.push(value); }, function () {
            buffer && subscriber.next(buffer);
            subscriber.complete();
        }, undefined, function () { return (buffer = closingSubscriber = null); }));
    });
}
exports.bufferWhen = bufferWhen;

},{"../observable/innerFrom":34,"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],56:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchError = void 0;
var innerFrom_1 = require("../observable/innerFrom");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var lift_1 = require("../util/lift");
function catchError(selector) {
    return lift_1.operate(function (source, subscriber) {
        var innerSub = null;
        var syncUnsub = false;
        var handledResult;
        innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, undefined, function (err) {
            handledResult = innerFrom_1.innerFrom(selector(err, catchError(selector)(source)));
            if (innerSub) {
                innerSub.unsubscribe();
                innerSub = null;
                handledResult.subscribe(subscriber);
            }
            else {
                syncUnsub = true;
            }
        }));
        if (syncUnsub) {
            innerSub.unsubscribe();
            innerSub = null;
            handledResult.subscribe(subscriber);
        }
    });
}
exports.catchError = catchError;

},{"../observable/innerFrom":34,"../util/lift":219,"./OperatorSubscriber":48}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineAll = void 0;
var combineLatestAll_1 = require("./combineLatestAll");
exports.combineAll = combineLatestAll_1.combineLatestAll;

},{"./combineLatestAll":59}],58:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineLatest = void 0;
var combineLatest_1 = require("../observable/combineLatest");
var lift_1 = require("../util/lift");
var argsOrArgArray_1 = require("../util/argsOrArgArray");
var mapOneOrManyArgs_1 = require("../util/mapOneOrManyArgs");
var pipe_1 = require("../util/pipe");
var args_1 = require("../util/args");
function combineLatest() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var resultSelector = args_1.popResultSelector(args);
    return resultSelector
        ? pipe_1.pipe(combineLatest.apply(void 0, __spreadArray([], __read(args))), mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector))
        : lift_1.operate(function (source, subscriber) {
            combineLatest_1.combineLatestInit(__spreadArray([source], __read(argsOrArgArray_1.argsOrArgArray(args))))(subscriber);
        });
}
exports.combineLatest = combineLatest;

},{"../observable/combineLatest":21,"../util/args":200,"../util/argsOrArgArray":202,"../util/lift":219,"../util/mapOneOrManyArgs":220,"../util/pipe":223}],59:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineLatestAll = void 0;
var combineLatest_1 = require("../observable/combineLatest");
var joinAllInternals_1 = require("./joinAllInternals");
function combineLatestAll(project) {
    return joinAllInternals_1.joinAllInternals(combineLatest_1.combineLatest, project);
}
exports.combineLatestAll = combineLatestAll;

},{"../observable/combineLatest":21,"./joinAllInternals":93}],60:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineLatestWith = void 0;
var combineLatest_1 = require("./combineLatest");
function combineLatestWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return combineLatest_1.combineLatest.apply(void 0, __spreadArray([], __read(otherSources)));
}
exports.combineLatestWith = combineLatestWith;

},{"./combineLatest":58}],61:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.concat = void 0;
var lift_1 = require("../util/lift");
var concatAll_1 = require("./concatAll");
var args_1 = require("../util/args");
var from_1 = require("../observable/from");
function concat() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(args);
    return lift_1.operate(function (source, subscriber) {
        concatAll_1.concatAll()(from_1.from(__spreadArray([source], __read(args)), scheduler)).subscribe(subscriber);
    });
}
exports.concat = concat;

},{"../observable/from":28,"../util/args":200,"../util/lift":219,"./concatAll":62}],62:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concatAll = void 0;
var mergeAll_1 = require("./mergeAll");
function concatAll() {
    return mergeAll_1.mergeAll(1);
}
exports.concatAll = concatAll;

},{"./mergeAll":100}],63:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concatMap = void 0;
var mergeMap_1 = require("./mergeMap");
var isFunction_1 = require("../util/isFunction");
function concatMap(project, resultSelector) {
    return isFunction_1.isFunction(resultSelector) ? mergeMap_1.mergeMap(project, resultSelector, 1) : mergeMap_1.mergeMap(project, 1);
}
exports.concatMap = concatMap;

},{"../util/isFunction":212,"./mergeMap":102}],64:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concatMapTo = void 0;
var concatMap_1 = require("./concatMap");
var isFunction_1 = require("../util/isFunction");
function concatMapTo(innerObservable, resultSelector) {
    return isFunction_1.isFunction(resultSelector) ? concatMap_1.concatMap(function () { return innerObservable; }, resultSelector) : concatMap_1.concatMap(function () { return innerObservable; });
}
exports.concatMapTo = concatMapTo;

},{"../util/isFunction":212,"./concatMap":63}],65:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.concatWith = void 0;
var concat_1 = require("./concat");
function concatWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return concat_1.concat.apply(void 0, __spreadArray([], __read(otherSources)));
}
exports.concatWith = concatWith;

},{"./concat":61}],66:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = void 0;
var Subject_1 = require("../Subject");
var innerFrom_1 = require("../observable/innerFrom");
var lift_1 = require("../util/lift");
var fromSubscribable_1 = require("../observable/fromSubscribable");
var DEFAULT_CONFIG = {
    connector: function () { return new Subject_1.Subject(); },
};
function connect(selector, config) {
    if (config === void 0) { config = DEFAULT_CONFIG; }
    var connector = config.connector;
    return lift_1.operate(function (source, subscriber) {
        var subject = connector();
        innerFrom_1.innerFrom(selector(fromSubscribable_1.fromSubscribable(subject))).subscribe(subscriber);
        subscriber.add(source.subscribe(subject));
    });
}
exports.connect = connect;

},{"../Subject":11,"../observable/fromSubscribable":31,"../observable/innerFrom":34,"../util/lift":219}],67:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.count = void 0;
var reduce_1 = require("./reduce");
function count(predicate) {
    return reduce_1.reduce(function (total, value, i) { return (!predicate || predicate(value, i) ? total + 1 : total); }, 0);
}
exports.count = count;

},{"./reduce":117}],68:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = void 0;
var lift_1 = require("../util/lift");
var noop_1 = require("../util/noop");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
function debounce(durationSelector) {
    return lift_1.operate(function (source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        var durationSubscriber = null;
        var emit = function () {
            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
            durationSubscriber = null;
            if (hasValue) {
                hasValue = false;
                var value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
            hasValue = true;
            lastValue = value;
            durationSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, emit, noop_1.noop);
            innerFrom_1.innerFrom(durationSelector(value)).subscribe(durationSubscriber);
        }, function () {
            emit();
            subscriber.complete();
        }, undefined, function () {
            lastValue = durationSubscriber = null;
        }));
    });
}
exports.debounce = debounce;

},{"../observable/innerFrom":34,"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],69:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounceTime = void 0;
var async_1 = require("../scheduler/async");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function debounceTime(dueTime, scheduler) {
    if (scheduler === void 0) { scheduler = async_1.asyncScheduler; }
    return lift_1.operate(function (source, subscriber) {
        var activeTask = null;
        var lastValue = null;
        var lastTime = null;
        var emit = function () {
            if (activeTask) {
                activeTask.unsubscribe();
                activeTask = null;
                var value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
        };
        function emitWhenIdle() {
            var targetTime = lastTime + dueTime;
            var now = scheduler.now();
            if (now < targetTime) {
                activeTask = this.schedule(undefined, targetTime - now);
                subscriber.add(activeTask);
                return;
            }
            emit();
        }
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            lastValue = value;
            lastTime = scheduler.now();
            if (!activeTask) {
                activeTask = scheduler.schedule(emitWhenIdle, dueTime);
                subscriber.add(activeTask);
            }
        }, function () {
            emit();
            subscriber.complete();
        }, undefined, function () {
            lastValue = activeTask = null;
        }));
    });
}
exports.debounceTime = debounceTime;

},{"../scheduler/async":183,"../util/lift":219,"./OperatorSubscriber":48}],70:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultIfEmpty = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function defaultIfEmpty(defaultValue) {
    return lift_1.operate(function (source, subscriber) {
        var hasValue = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            subscriber.next(value);
        }, function () {
            if (!hasValue) {
                subscriber.next(defaultValue);
            }
            subscriber.complete();
        }));
    });
}
exports.defaultIfEmpty = defaultIfEmpty;

},{"../util/lift":219,"./OperatorSubscriber":48}],71:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = void 0;
var async_1 = require("../scheduler/async");
var delayWhen_1 = require("./delayWhen");
var timer_1 = require("../observable/timer");
function delay(due, scheduler) {
    if (scheduler === void 0) { scheduler = async_1.asyncScheduler; }
    var duration = timer_1.timer(due, scheduler);
    return delayWhen_1.delayWhen(function () { return duration; });
}
exports.delay = delay;

},{"../observable/timer":45,"../scheduler/async":183,"./delayWhen":72}],72:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delayWhen = void 0;
var concat_1 = require("../observable/concat");
var take_1 = require("./take");
var ignoreElements_1 = require("./ignoreElements");
var mapTo_1 = require("./mapTo");
var mergeMap_1 = require("./mergeMap");
var innerFrom_1 = require("../observable/innerFrom");
function delayWhen(delayDurationSelector, subscriptionDelay) {
    if (subscriptionDelay) {
        return function (source) {
            return concat_1.concat(subscriptionDelay.pipe(take_1.take(1), ignoreElements_1.ignoreElements()), source.pipe(delayWhen(delayDurationSelector)));
        };
    }
    return mergeMap_1.mergeMap(function (value, index) { return innerFrom_1.innerFrom(delayDurationSelector(value, index)).pipe(take_1.take(1), mapTo_1.mapTo(value)); });
}
exports.delayWhen = delayWhen;

},{"../observable/concat":22,"../observable/innerFrom":34,"./ignoreElements":91,"./mapTo":96,"./mergeMap":102,"./take":141}],73:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dematerialize = void 0;
var Notification_1 = require("../Notification");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function dematerialize() {
    return lift_1.operate(function (source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (notification) { return Notification_1.observeNotification(notification, subscriber); }));
    });
}
exports.dematerialize = dematerialize;

},{"../Notification":6,"../util/lift":219,"./OperatorSubscriber":48}],74:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distinct = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var noop_1 = require("../util/noop");
var innerFrom_1 = require("../observable/innerFrom");
function distinct(keySelector, flushes) {
    return lift_1.operate(function (source, subscriber) {
        var distinctKeys = new Set();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var key = keySelector ? keySelector(value) : value;
            if (!distinctKeys.has(key)) {
                distinctKeys.add(key);
                subscriber.next(value);
            }
        }));
        flushes && innerFrom_1.innerFrom(flushes).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () { return distinctKeys.clear(); }, noop_1.noop));
    });
}
exports.distinct = distinct;

},{"../observable/innerFrom":34,"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],75:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distinctUntilChanged = void 0;
var identity_1 = require("../util/identity");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function distinctUntilChanged(comparator, keySelector) {
    if (keySelector === void 0) { keySelector = identity_1.identity; }
    comparator = comparator !== null && comparator !== void 0 ? comparator : defaultCompare;
    return lift_1.operate(function (source, subscriber) {
        var previousKey;
        var first = true;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var currentKey = keySelector(value);
            if (first || !comparator(previousKey, currentKey)) {
                first = false;
                previousKey = currentKey;
                subscriber.next(value);
            }
        }));
    });
}
exports.distinctUntilChanged = distinctUntilChanged;
function defaultCompare(a, b) {
    return a === b;
}

},{"../util/identity":208,"../util/lift":219,"./OperatorSubscriber":48}],76:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distinctUntilKeyChanged = void 0;
var distinctUntilChanged_1 = require("./distinctUntilChanged");
function distinctUntilKeyChanged(key, compare) {
    return distinctUntilChanged_1.distinctUntilChanged(function (x, y) { return compare ? compare(x[key], y[key]) : x[key] === y[key]; });
}
exports.distinctUntilKeyChanged = distinctUntilKeyChanged;

},{"./distinctUntilChanged":75}],77:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementAt = void 0;
var ArgumentOutOfRangeError_1 = require("../util/ArgumentOutOfRangeError");
var filter_1 = require("./filter");
var throwIfEmpty_1 = require("./throwIfEmpty");
var defaultIfEmpty_1 = require("./defaultIfEmpty");
var take_1 = require("./take");
function elementAt(index, defaultValue) {
    if (index < 0) {
        throw new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError();
    }
    var hasDefaultValue = arguments.length >= 2;
    return function (source) {
        return source.pipe(filter_1.filter(function (v, i) { return i === index; }), take_1.take(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function () { return new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError(); }));
    };
}
exports.elementAt = elementAt;

},{"../util/ArgumentOutOfRangeError":193,"./defaultIfEmpty":70,"./filter":84,"./take":141,"./throwIfEmpty":148}],78:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endWith = void 0;
var concat_1 = require("../observable/concat");
var of_1 = require("../observable/of");
function endWith() {
    var values = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
    }
    return function (source) { return concat_1.concat(source, of_1.of.apply(void 0, __spreadArray([], __read(values)))); };
}
exports.endWith = endWith;

},{"../observable/concat":22,"../observable/of":38}],79:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.every = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function every(predicate, thisArg) {
    return lift_1.operate(function (source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            if (!predicate.call(thisArg, value, index++, source)) {
                subscriber.next(false);
                subscriber.complete();
            }
        }, function () {
            subscriber.next(true);
            subscriber.complete();
        }));
    });
}
exports.every = every;

},{"../util/lift":219,"./OperatorSubscriber":48}],80:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exhaust = void 0;
var exhaustAll_1 = require("./exhaustAll");
exports.exhaust = exhaustAll_1.exhaustAll;

},{"./exhaustAll":81}],81:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exhaustAll = void 0;
var exhaustMap_1 = require("./exhaustMap");
var identity_1 = require("../util/identity");
function exhaustAll() {
    return exhaustMap_1.exhaustMap(identity_1.identity);
}
exports.exhaustAll = exhaustAll;

},{"../util/identity":208,"./exhaustMap":82}],82:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exhaustMap = void 0;
var map_1 = require("./map");
var innerFrom_1 = require("../observable/innerFrom");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function exhaustMap(project, resultSelector) {
    if (resultSelector) {
        return function (source) {
            return source.pipe(exhaustMap(function (a, i) { return innerFrom_1.innerFrom(project(a, i)).pipe(map_1.map(function (b, ii) { return resultSelector(a, b, i, ii); })); }));
        };
    }
    return lift_1.operate(function (source, subscriber) {
        var index = 0;
        var innerSub = null;
        var isComplete = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (outerValue) {
            if (!innerSub) {
                innerSub = OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, function () {
                    innerSub = null;
                    isComplete && subscriber.complete();
                });
                innerFrom_1.innerFrom(project(outerValue, index++)).subscribe(innerSub);
            }
        }, function () {
            isComplete = true;
            !innerSub && subscriber.complete();
        }));
    });
}
exports.exhaustMap = exhaustMap;

},{"../observable/innerFrom":34,"../util/lift":219,"./OperatorSubscriber":48,"./map":95}],83:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expand = void 0;
var lift_1 = require("../util/lift");
var mergeInternals_1 = require("./mergeInternals");
function expand(project, concurrent, scheduler) {
    if (concurrent === void 0) { concurrent = Infinity; }
    concurrent = (concurrent || 0) < 1 ? Infinity : concurrent;
    return lift_1.operate(function (source, subscriber) {
        return mergeInternals_1.mergeInternals(source, subscriber, project, concurrent, undefined, true, scheduler);
    });
}
exports.expand = expand;

},{"../util/lift":219,"./mergeInternals":101}],84:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filter = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function filter(predicate, thisArg) {
    return lift_1.operate(function (source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) { return predicate.call(thisArg, value, index++) && subscriber.next(value); }));
    });
}
exports.filter = filter;

},{"../util/lift":219,"./OperatorSubscriber":48}],85:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalize = void 0;
var lift_1 = require("../util/lift");
function finalize(callback) {
    return lift_1.operate(function (source, subscriber) {
        try {
            source.subscribe(subscriber);
        }
        finally {
            subscriber.add(callback);
        }
    });
}
exports.finalize = finalize;

},{"../util/lift":219}],86:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFind = exports.find = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function find(predicate, thisArg) {
    return lift_1.operate(createFind(predicate, thisArg, 'value'));
}
exports.find = find;
function createFind(predicate, thisArg, emit) {
    var findIndex = emit === 'index';
    return function (source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var i = index++;
            if (predicate.call(thisArg, value, i, source)) {
                subscriber.next(findIndex ? i : value);
                subscriber.complete();
            }
        }, function () {
            subscriber.next(findIndex ? -1 : undefined);
            subscriber.complete();
        }));
    };
}
exports.createFind = createFind;

},{"../util/lift":219,"./OperatorSubscriber":48}],87:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findIndex = void 0;
var lift_1 = require("../util/lift");
var find_1 = require("./find");
function findIndex(predicate, thisArg) {
    return lift_1.operate(find_1.createFind(predicate, thisArg, 'index'));
}
exports.findIndex = findIndex;

},{"../util/lift":219,"./find":86}],88:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.first = void 0;
var EmptyError_1 = require("../util/EmptyError");
var filter_1 = require("./filter");
var take_1 = require("./take");
var defaultIfEmpty_1 = require("./defaultIfEmpty");
var throwIfEmpty_1 = require("./throwIfEmpty");
var identity_1 = require("../util/identity");
function first(predicate, defaultValue) {
    var hasDefaultValue = arguments.length >= 2;
    return function (source) {
        return source.pipe(predicate ? filter_1.filter(function (v, i) { return predicate(v, i, source); }) : identity_1.identity, take_1.take(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function () { return new EmptyError_1.EmptyError(); }));
    };
}
exports.first = first;

},{"../util/EmptyError":194,"../util/identity":208,"./defaultIfEmpty":70,"./filter":84,"./take":141,"./throwIfEmpty":148}],89:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flatMap = void 0;
var mergeMap_1 = require("./mergeMap");
exports.flatMap = mergeMap_1.mergeMap;

},{"./mergeMap":102}],90:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBy = void 0;
var Observable_1 = require("../Observable");
var innerFrom_1 = require("../observable/innerFrom");
var Subject_1 = require("../Subject");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function groupBy(keySelector, elementOrOptions, duration, connector) {
    return lift_1.operate(function (source, subscriber) {
        var element;
        if (!elementOrOptions || typeof elementOrOptions === 'function') {
            element = elementOrOptions;
        }
        else {
            (duration = elementOrOptions.duration, element = elementOrOptions.element, connector = elementOrOptions.connector);
        }
        var groups = new Map();
        var notify = function (cb) {
            groups.forEach(cb);
            cb(subscriber);
        };
        var handleError = function (err) { return notify(function (consumer) { return consumer.error(err); }); };
        var activeGroups = 0;
        var teardownAttempted = false;
        var groupBySourceSubscriber = new OperatorSubscriber_1.OperatorSubscriber(subscriber, function (value) {
            try {
                var key_1 = keySelector(value);
                var group_1 = groups.get(key_1);
                if (!group_1) {
                    groups.set(key_1, (group_1 = connector ? connector() : new Subject_1.Subject()));
                    var grouped = createGroupedObservable(key_1, group_1);
                    subscriber.next(grouped);
                    if (duration) {
                        var durationSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(group_1, function () {
                            group_1.complete();
                            durationSubscriber_1 === null || durationSubscriber_1 === void 0 ? void 0 : durationSubscriber_1.unsubscribe();
                        }, undefined, undefined, function () { return groups.delete(key_1); });
                        groupBySourceSubscriber.add(innerFrom_1.innerFrom(duration(grouped)).subscribe(durationSubscriber_1));
                    }
                }
                group_1.next(element ? element(value) : value);
            }
            catch (err) {
                handleError(err);
            }
        }, function () { return notify(function (consumer) { return consumer.complete(); }); }, handleError, function () { return groups.clear(); }, function () {
            teardownAttempted = true;
            return activeGroups === 0;
        });
        source.subscribe(groupBySourceSubscriber);
        function createGroupedObservable(key, groupSubject) {
            var result = new Observable_1.Observable(function (groupSubscriber) {
                activeGroups++;
                var innerSub = groupSubject.subscribe(groupSubscriber);
                return function () {
                    innerSub.unsubscribe();
                    --activeGroups === 0 && teardownAttempted && groupBySourceSubscriber.unsubscribe();
                };
            });
            result.key = key;
            return result;
        }
    });
}
exports.groupBy = groupBy;

},{"../Observable":8,"../Subject":11,"../observable/innerFrom":34,"../util/lift":219,"./OperatorSubscriber":48}],91:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ignoreElements = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var noop_1 = require("../util/noop");
function ignoreElements() {
    return lift_1.operate(function (source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, noop_1.noop));
    });
}
exports.ignoreElements = ignoreElements;

},{"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],92:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmpty = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function isEmpty() {
    return lift_1.operate(function (source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () {
            subscriber.next(false);
            subscriber.complete();
        }, function () {
            subscriber.next(true);
            subscriber.complete();
        }));
    });
}
exports.isEmpty = isEmpty;

},{"../util/lift":219,"./OperatorSubscriber":48}],93:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinAllInternals = void 0;
var identity_1 = require("../util/identity");
var mapOneOrManyArgs_1 = require("../util/mapOneOrManyArgs");
var pipe_1 = require("../util/pipe");
var mergeMap_1 = require("./mergeMap");
var toArray_1 = require("./toArray");
function joinAllInternals(joinFn, project) {
    return pipe_1.pipe(toArray_1.toArray(), mergeMap_1.mergeMap(function (sources) { return joinFn(sources); }), project ? mapOneOrManyArgs_1.mapOneOrManyArgs(project) : identity_1.identity);
}
exports.joinAllInternals = joinAllInternals;

},{"../util/identity":208,"../util/mapOneOrManyArgs":220,"../util/pipe":223,"./mergeMap":102,"./toArray":153}],94:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.last = void 0;
var EmptyError_1 = require("../util/EmptyError");
var filter_1 = require("./filter");
var takeLast_1 = require("./takeLast");
var throwIfEmpty_1 = require("./throwIfEmpty");
var defaultIfEmpty_1 = require("./defaultIfEmpty");
var identity_1 = require("../util/identity");
function last(predicate, defaultValue) {
    var hasDefaultValue = arguments.length >= 2;
    return function (source) {
        return source.pipe(predicate ? filter_1.filter(function (v, i) { return predicate(v, i, source); }) : identity_1.identity, takeLast_1.takeLast(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function () { return new EmptyError_1.EmptyError(); }));
    };
}
exports.last = last;

},{"../util/EmptyError":194,"../util/identity":208,"./defaultIfEmpty":70,"./filter":84,"./takeLast":142,"./throwIfEmpty":148}],95:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function map(project, thisArg) {
    return lift_1.operate(function (source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            subscriber.next(project.call(thisArg, value, index++));
        }));
    });
}
exports.map = map;

},{"../util/lift":219,"./OperatorSubscriber":48}],96:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapTo = void 0;
var map_1 = require("./map");
function mapTo(value) {
    return map_1.map(function () { return value; });
}
exports.mapTo = mapTo;

},{"./map":95}],97:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.materialize = void 0;
var Notification_1 = require("../Notification");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function materialize() {
    return lift_1.operate(function (source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            subscriber.next(Notification_1.Notification.createNext(value));
        }, function () {
            subscriber.next(Notification_1.Notification.createComplete());
            subscriber.complete();
        }, function (err) {
            subscriber.next(Notification_1.Notification.createError(err));
            subscriber.complete();
        }));
    });
}
exports.materialize = materialize;

},{"../Notification":6,"../util/lift":219,"./OperatorSubscriber":48}],98:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.max = void 0;
var reduce_1 = require("./reduce");
var isFunction_1 = require("../util/isFunction");
function max(comparer) {
    return reduce_1.reduce(isFunction_1.isFunction(comparer) ? function (x, y) { return (comparer(x, y) > 0 ? x : y); } : function (x, y) { return (x > y ? x : y); });
}
exports.max = max;

},{"../util/isFunction":212,"./reduce":117}],99:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.merge = void 0;
var lift_1 = require("../util/lift");
var argsOrArgArray_1 = require("../util/argsOrArgArray");
var mergeAll_1 = require("./mergeAll");
var args_1 = require("../util/args");
var from_1 = require("../observable/from");
function merge() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(args);
    var concurrent = args_1.popNumber(args, Infinity);
    args = argsOrArgArray_1.argsOrArgArray(args);
    return lift_1.operate(function (source, subscriber) {
        mergeAll_1.mergeAll(concurrent)(from_1.from(__spreadArray([source], __read(args)), scheduler)).subscribe(subscriber);
    });
}
exports.merge = merge;

},{"../observable/from":28,"../util/args":200,"../util/argsOrArgArray":202,"../util/lift":219,"./mergeAll":100}],100:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeAll = void 0;
var mergeMap_1 = require("./mergeMap");
var identity_1 = require("../util/identity");
function mergeAll(concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    return mergeMap_1.mergeMap(identity_1.identity, concurrent);
}
exports.mergeAll = mergeAll;

},{"../util/identity":208,"./mergeMap":102}],101:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeInternals = void 0;
var innerFrom_1 = require("../observable/innerFrom");
var executeSchedule_1 = require("../util/executeSchedule");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
    var buffer = [];
    var active = 0;
    var index = 0;
    var isComplete = false;
    var checkComplete = function () {
        if (isComplete && !buffer.length && !active) {
            subscriber.complete();
        }
    };
    var outerNext = function (value) { return (active < concurrent ? doInnerSub(value) : buffer.push(value)); };
    var doInnerSub = function (value) {
        expand && subscriber.next(value);
        active++;
        var innerComplete = false;
        innerFrom_1.innerFrom(project(value, index++)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (innerValue) {
            onBeforeNext === null || onBeforeNext === void 0 ? void 0 : onBeforeNext(innerValue);
            if (expand) {
                outerNext(innerValue);
            }
            else {
                subscriber.next(innerValue);
            }
        }, function () {
            innerComplete = true;
        }, undefined, function () {
            if (innerComplete) {
                try {
                    active--;
                    var _loop_1 = function () {
                        var bufferedValue = buffer.shift();
                        if (innerSubScheduler) {
                            executeSchedule_1.executeSchedule(subscriber, innerSubScheduler, function () { return doInnerSub(bufferedValue); });
                        }
                        else {
                            doInnerSub(bufferedValue);
                        }
                    };
                    while (buffer.length && active < concurrent) {
                        _loop_1();
                    }
                    checkComplete();
                }
                catch (err) {
                    subscriber.error(err);
                }
            }
        }));
    };
    source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, outerNext, function () {
        isComplete = true;
        checkComplete();
    }));
    return function () {
        additionalFinalizer === null || additionalFinalizer === void 0 ? void 0 : additionalFinalizer();
    };
}
exports.mergeInternals = mergeInternals;

},{"../observable/innerFrom":34,"../util/executeSchedule":207,"./OperatorSubscriber":48}],102:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeMap = void 0;
var map_1 = require("./map");
var innerFrom_1 = require("../observable/innerFrom");
var lift_1 = require("../util/lift");
var mergeInternals_1 = require("./mergeInternals");
var isFunction_1 = require("../util/isFunction");
function mergeMap(project, resultSelector, concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    if (isFunction_1.isFunction(resultSelector)) {
        return mergeMap(function (a, i) { return map_1.map(function (b, ii) { return resultSelector(a, b, i, ii); })(innerFrom_1.innerFrom(project(a, i))); }, concurrent);
    }
    else if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return lift_1.operate(function (source, subscriber) { return mergeInternals_1.mergeInternals(source, subscriber, project, concurrent); });
}
exports.mergeMap = mergeMap;

},{"../observable/innerFrom":34,"../util/isFunction":212,"../util/lift":219,"./map":95,"./mergeInternals":101}],103:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeMapTo = void 0;
var mergeMap_1 = require("./mergeMap");
var isFunction_1 = require("../util/isFunction");
function mergeMapTo(innerObservable, resultSelector, concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    if (isFunction_1.isFunction(resultSelector)) {
        return mergeMap_1.mergeMap(function () { return innerObservable; }, resultSelector, concurrent);
    }
    if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return mergeMap_1.mergeMap(function () { return innerObservable; }, concurrent);
}
exports.mergeMapTo = mergeMapTo;

},{"../util/isFunction":212,"./mergeMap":102}],104:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeScan = void 0;
var lift_1 = require("../util/lift");
var mergeInternals_1 = require("./mergeInternals");
function mergeScan(accumulator, seed, concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    return lift_1.operate(function (source, subscriber) {
        var state = seed;
        return mergeInternals_1.mergeInternals(source, subscriber, function (value, index) { return accumulator(state, value, index); }, concurrent, function (value) {
            state = value;
        }, false, undefined, function () { return (state = null); });
    });
}
exports.mergeScan = mergeScan;

},{"../util/lift":219,"./mergeInternals":101}],105:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeWith = void 0;
var merge_1 = require("./merge");
function mergeWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return merge_1.merge.apply(void 0, __spreadArray([], __read(otherSources)));
}
exports.mergeWith = mergeWith;

},{"./merge":99}],106:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.min = void 0;
var reduce_1 = require("./reduce");
var isFunction_1 = require("../util/isFunction");
function min(comparer) {
    return reduce_1.reduce(isFunction_1.isFunction(comparer) ? function (x, y) { return (comparer(x, y) < 0 ? x : y); } : function (x, y) { return (x < y ? x : y); });
}
exports.min = min;

},{"../util/isFunction":212,"./reduce":117}],107:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multicast = void 0;
var ConnectableObservable_1 = require("../observable/ConnectableObservable");
var isFunction_1 = require("../util/isFunction");
var connect_1 = require("./connect");
function multicast(subjectOrSubjectFactory, selector) {
    var subjectFactory = isFunction_1.isFunction(subjectOrSubjectFactory) ? subjectOrSubjectFactory : function () { return subjectOrSubjectFactory; };
    if (isFunction_1.isFunction(selector)) {
        return connect_1.connect(selector, {
            connector: subjectFactory,
        });
    }
    return function (source) { return new ConnectableObservable_1.ConnectableObservable(source, subjectFactory); };
}
exports.multicast = multicast;

},{"../observable/ConnectableObservable":17,"../util/isFunction":212,"./connect":66}],108:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observeOn = void 0;
var executeSchedule_1 = require("../util/executeSchedule");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function observeOn(scheduler, delay) {
    if (delay === void 0) { delay = 0; }
    return lift_1.operate(function (source, subscriber) {
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) { return executeSchedule_1.executeSchedule(subscriber, scheduler, function () { return subscriber.next(value); }, delay); }, function () { return executeSchedule_1.executeSchedule(subscriber, scheduler, function () { return subscriber.complete(); }, delay); }, function (err) { return executeSchedule_1.executeSchedule(subscriber, scheduler, function () { return subscriber.error(err); }, delay); }));
    });
}
exports.observeOn = observeOn;

},{"../util/executeSchedule":207,"../util/lift":219,"./OperatorSubscriber":48}],109:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onErrorResumeNext = exports.onErrorResumeNextWith = void 0;
var argsOrArgArray_1 = require("../util/argsOrArgArray");
var onErrorResumeNext_1 = require("../observable/onErrorResumeNext");
function onErrorResumeNextWith() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    var nextSources = argsOrArgArray_1.argsOrArgArray(sources);
    return function (source) { return onErrorResumeNext_1.onErrorResumeNext.apply(void 0, __spreadArray([source], __read(nextSources))); };
}
exports.onErrorResumeNextWith = onErrorResumeNextWith;
exports.onErrorResumeNext = onErrorResumeNextWith;

},{"../observable/onErrorResumeNext":39,"../util/argsOrArgArray":202}],110:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pairwise = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function pairwise() {
    return lift_1.operate(function (source, subscriber) {
        var prev;
        var hasPrev = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var p = prev;
            prev = value;
            hasPrev && subscriber.next([p, value]);
            hasPrev = true;
        }));
    });
}
exports.pairwise = pairwise;

},{"../util/lift":219,"./OperatorSubscriber":48}],111:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluck = void 0;
var map_1 = require("./map");
function pluck() {
    var properties = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        properties[_i] = arguments[_i];
    }
    var length = properties.length;
    if (length === 0) {
        throw new Error('list of properties cannot be empty.');
    }
    return map_1.map(function (x) {
        var currentProp = x;
        for (var i = 0; i < length; i++) {
            var p = currentProp === null || currentProp === void 0 ? void 0 : currentProp[properties[i]];
            if (typeof p !== 'undefined') {
                currentProp = p;
            }
            else {
                return undefined;
            }
        }
        return currentProp;
    });
}
exports.pluck = pluck;

},{"./map":95}],112:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publish = void 0;
var Subject_1 = require("../Subject");
var multicast_1 = require("./multicast");
var connect_1 = require("./connect");
function publish(selector) {
    return selector ? function (source) { return connect_1.connect(selector)(source); } : function (source) { return multicast_1.multicast(new Subject_1.Subject())(source); };
}
exports.publish = publish;

},{"../Subject":11,"./connect":66,"./multicast":107}],113:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishBehavior = void 0;
var BehaviorSubject_1 = require("../BehaviorSubject");
var ConnectableObservable_1 = require("../observable/ConnectableObservable");
function publishBehavior(initialValue) {
    return function (source) {
        var subject = new BehaviorSubject_1.BehaviorSubject(initialValue);
        return new ConnectableObservable_1.ConnectableObservable(source, function () { return subject; });
    };
}
exports.publishBehavior = publishBehavior;

},{"../BehaviorSubject":5,"../observable/ConnectableObservable":17}],114:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishLast = void 0;
var AsyncSubject_1 = require("../AsyncSubject");
var ConnectableObservable_1 = require("../observable/ConnectableObservable");
function publishLast() {
    return function (source) {
        var subject = new AsyncSubject_1.AsyncSubject();
        return new ConnectableObservable_1.ConnectableObservable(source, function () { return subject; });
    };
}
exports.publishLast = publishLast;

},{"../AsyncSubject":4,"../observable/ConnectableObservable":17}],115:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishReplay = void 0;
var ReplaySubject_1 = require("../ReplaySubject");
var multicast_1 = require("./multicast");
var isFunction_1 = require("../util/isFunction");
function publishReplay(bufferSize, windowTime, selectorOrScheduler, timestampProvider) {
    if (selectorOrScheduler && !isFunction_1.isFunction(selectorOrScheduler)) {
        timestampProvider = selectorOrScheduler;
    }
    var selector = isFunction_1.isFunction(selectorOrScheduler) ? selectorOrScheduler : undefined;
    return function (source) { return multicast_1.multicast(new ReplaySubject_1.ReplaySubject(bufferSize, windowTime, timestampProvider), selector)(source); };
}
exports.publishReplay = publishReplay;

},{"../ReplaySubject":9,"../util/isFunction":212,"./multicast":107}],116:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.raceWith = void 0;
var race_1 = require("../observable/race");
var lift_1 = require("../util/lift");
var identity_1 = require("../util/identity");
function raceWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return !otherSources.length
        ? identity_1.identity
        : lift_1.operate(function (source, subscriber) {
            race_1.raceInit(__spreadArray([source], __read(otherSources)))(subscriber);
        });
}
exports.raceWith = raceWith;

},{"../observable/race":42,"../util/identity":208,"../util/lift":219}],117:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduce = void 0;
var scanInternals_1 = require("./scanInternals");
var lift_1 = require("../util/lift");
function reduce(accumulator, seed) {
    return lift_1.operate(scanInternals_1.scanInternals(accumulator, seed, arguments.length >= 2, false, true));
}
exports.reduce = reduce;

},{"../util/lift":219,"./scanInternals":126}],118:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refCount = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function refCount() {
    return lift_1.operate(function (source, subscriber) {
        var connection = null;
        source._refCount++;
        var refCounter = OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, undefined, undefined, function () {
            if (!source || source._refCount <= 0 || 0 < --source._refCount) {
                connection = null;
                return;
            }
            var sharedConnection = source._connection;
            var conn = connection;
            connection = null;
            if (sharedConnection && (!conn || sharedConnection === conn)) {
                sharedConnection.unsubscribe();
            }
            subscriber.unsubscribe();
        });
        source.subscribe(refCounter);
        if (!refCounter.closed) {
            connection = source.connect();
        }
    });
}
exports.refCount = refCount;

},{"../util/lift":219,"./OperatorSubscriber":48}],119:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repeat = void 0;
var empty_1 = require("../observable/empty");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
var timer_1 = require("../observable/timer");
function repeat(countOrConfig) {
    var _a;
    var count = Infinity;
    var delay;
    if (countOrConfig != null) {
        if (typeof countOrConfig === 'object') {
            (_a = countOrConfig.count, count = _a === void 0 ? Infinity : _a, delay = countOrConfig.delay);
        }
        else {
            count = countOrConfig;
        }
    }
    return count <= 0
        ? function () { return empty_1.EMPTY; }
        : lift_1.operate(function (source, subscriber) {
            var soFar = 0;
            var sourceSub;
            var resubscribe = function () {
                sourceSub === null || sourceSub === void 0 ? void 0 : sourceSub.unsubscribe();
                sourceSub = null;
                if (delay != null) {
                    var notifier = typeof delay === 'number' ? timer_1.timer(delay) : innerFrom_1.innerFrom(delay(soFar));
                    var notifierSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () {
                        notifierSubscriber_1.unsubscribe();
                        subscribeToSource();
                    });
                    notifier.subscribe(notifierSubscriber_1);
                }
                else {
                    subscribeToSource();
                }
            };
            var subscribeToSource = function () {
                var syncUnsub = false;
                sourceSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, function () {
                    if (++soFar < count) {
                        if (sourceSub) {
                            resubscribe();
                        }
                        else {
                            syncUnsub = true;
                        }
                    }
                    else {
                        subscriber.complete();
                    }
                }));
                if (syncUnsub) {
                    resubscribe();
                }
            };
            subscribeToSource();
        });
}
exports.repeat = repeat;

},{"../observable/empty":26,"../observable/innerFrom":34,"../observable/timer":45,"../util/lift":219,"./OperatorSubscriber":48}],120:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repeatWhen = void 0;
var innerFrom_1 = require("../observable/innerFrom");
var Subject_1 = require("../Subject");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function repeatWhen(notifier) {
    return lift_1.operate(function (source, subscriber) {
        var innerSub;
        var syncResub = false;
        var completions$;
        var isNotifierComplete = false;
        var isMainComplete = false;
        var checkComplete = function () { return isMainComplete && isNotifierComplete && (subscriber.complete(), true); };
        var getCompletionSubject = function () {
            if (!completions$) {
                completions$ = new Subject_1.Subject();
                innerFrom_1.innerFrom(notifier(completions$)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () {
                    if (innerSub) {
                        subscribeForRepeatWhen();
                    }
                    else {
                        syncResub = true;
                    }
                }, function () {
                    isNotifierComplete = true;
                    checkComplete();
                }));
            }
            return completions$;
        };
        var subscribeForRepeatWhen = function () {
            isMainComplete = false;
            innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, function () {
                isMainComplete = true;
                !checkComplete() && getCompletionSubject().next();
            }));
            if (syncResub) {
                innerSub.unsubscribe();
                innerSub = null;
                syncResub = false;
                subscribeForRepeatWhen();
            }
        };
        subscribeForRepeatWhen();
    });
}
exports.repeatWhen = repeatWhen;

},{"../Subject":11,"../observable/innerFrom":34,"../util/lift":219,"./OperatorSubscriber":48}],121:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var identity_1 = require("../util/identity");
var timer_1 = require("../observable/timer");
var innerFrom_1 = require("../observable/innerFrom");
function retry(configOrCount) {
    if (configOrCount === void 0) { configOrCount = Infinity; }
    var config;
    if (configOrCount && typeof configOrCount === 'object') {
        config = configOrCount;
    }
    else {
        config = {
            count: configOrCount,
        };
    }
    var _a = config.count, count = _a === void 0 ? Infinity : _a, delay = config.delay, _b = config.resetOnSuccess, resetOnSuccess = _b === void 0 ? false : _b;
    return count <= 0
        ? identity_1.identity
        : lift_1.operate(function (source, subscriber) {
            var soFar = 0;
            var innerSub;
            var subscribeForRetry = function () {
                var syncUnsub = false;
                innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
                    if (resetOnSuccess) {
                        soFar = 0;
                    }
                    subscriber.next(value);
                }, undefined, function (err) {
                    if (soFar++ < count) {
                        var resub_1 = function () {
                            if (innerSub) {
                                innerSub.unsubscribe();
                                innerSub = null;
                                subscribeForRetry();
                            }
                            else {
                                syncUnsub = true;
                            }
                        };
                        if (delay != null) {
                            var notifier = typeof delay === 'number' ? timer_1.timer(delay) : innerFrom_1.innerFrom(delay(err, soFar));
                            var notifierSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () {
                                notifierSubscriber_1.unsubscribe();
                                resub_1();
                            }, function () {
                                subscriber.complete();
                            });
                            notifier.subscribe(notifierSubscriber_1);
                        }
                        else {
                            resub_1();
                        }
                    }
                    else {
                        subscriber.error(err);
                    }
                }));
                if (syncUnsub) {
                    innerSub.unsubscribe();
                    innerSub = null;
                    subscribeForRetry();
                }
            };
            subscribeForRetry();
        });
}
exports.retry = retry;

},{"../observable/innerFrom":34,"../observable/timer":45,"../util/identity":208,"../util/lift":219,"./OperatorSubscriber":48}],122:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWhen = void 0;
var innerFrom_1 = require("../observable/innerFrom");
var Subject_1 = require("../Subject");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function retryWhen(notifier) {
    return lift_1.operate(function (source, subscriber) {
        var innerSub;
        var syncResub = false;
        var errors$;
        var subscribeForRetryWhen = function () {
            innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, undefined, function (err) {
                if (!errors$) {
                    errors$ = new Subject_1.Subject();
                    innerFrom_1.innerFrom(notifier(errors$)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () {
                        return innerSub ? subscribeForRetryWhen() : (syncResub = true);
                    }));
                }
                if (errors$) {
                    errors$.next(err);
                }
            }));
            if (syncResub) {
                innerSub.unsubscribe();
                innerSub = null;
                syncResub = false;
                subscribeForRetryWhen();
            }
        };
        subscribeForRetryWhen();
    });
}
exports.retryWhen = retryWhen;

},{"../Subject":11,"../observable/innerFrom":34,"../util/lift":219,"./OperatorSubscriber":48}],123:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sample = void 0;
var innerFrom_1 = require("../observable/innerFrom");
var lift_1 = require("../util/lift");
var noop_1 = require("../util/noop");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function sample(notifier) {
    return lift_1.operate(function (source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            lastValue = value;
        }));
        innerFrom_1.innerFrom(notifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () {
            if (hasValue) {
                hasValue = false;
                var value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
        }, noop_1.noop));
    });
}
exports.sample = sample;

},{"../observable/innerFrom":34,"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],124:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleTime = void 0;
var async_1 = require("../scheduler/async");
var sample_1 = require("./sample");
var interval_1 = require("../observable/interval");
function sampleTime(period, scheduler) {
    if (scheduler === void 0) { scheduler = async_1.asyncScheduler; }
    return sample_1.sample(interval_1.interval(period, scheduler));
}
exports.sampleTime = sampleTime;

},{"../observable/interval":35,"../scheduler/async":183,"./sample":123}],125:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scan = void 0;
var lift_1 = require("../util/lift");
var scanInternals_1 = require("./scanInternals");
function scan(accumulator, seed) {
    return lift_1.operate(scanInternals_1.scanInternals(accumulator, seed, arguments.length >= 2, true));
}
exports.scan = scan;

},{"../util/lift":219,"./scanInternals":126}],126:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanInternals = void 0;
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function scanInternals(accumulator, seed, hasSeed, emitOnNext, emitBeforeComplete) {
    return function (source, subscriber) {
        var hasState = hasSeed;
        var state = seed;
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var i = index++;
            state = hasState
                ?
                    accumulator(state, value, i)
                :
                    ((hasState = true), value);
            emitOnNext && subscriber.next(state);
        }, emitBeforeComplete &&
            (function () {
                hasState && subscriber.next(state);
                subscriber.complete();
            })));
    };
}
exports.scanInternals = scanInternals;

},{"./OperatorSubscriber":48}],127:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceEqual = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
function sequenceEqual(compareTo, comparator) {
    if (comparator === void 0) { comparator = function (a, b) { return a === b; }; }
    return lift_1.operate(function (source, subscriber) {
        var aState = createState();
        var bState = createState();
        var emit = function (isEqual) {
            subscriber.next(isEqual);
            subscriber.complete();
        };
        var createSubscriber = function (selfState, otherState) {
            var sequenceEqualSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (a) {
                var buffer = otherState.buffer, complete = otherState.complete;
                if (buffer.length === 0) {
                    complete ? emit(false) : selfState.buffer.push(a);
                }
                else {
                    !comparator(a, buffer.shift()) && emit(false);
                }
            }, function () {
                selfState.complete = true;
                var complete = otherState.complete, buffer = otherState.buffer;
                complete && emit(buffer.length === 0);
                sequenceEqualSubscriber === null || sequenceEqualSubscriber === void 0 ? void 0 : sequenceEqualSubscriber.unsubscribe();
            });
            return sequenceEqualSubscriber;
        };
        source.subscribe(createSubscriber(aState, bState));
        innerFrom_1.innerFrom(compareTo).subscribe(createSubscriber(bState, aState));
    });
}
exports.sequenceEqual = sequenceEqual;
function createState() {
    return {
        buffer: [],
        complete: false,
    };
}

},{"../observable/innerFrom":34,"../util/lift":219,"./OperatorSubscriber":48}],128:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.share = void 0;
var innerFrom_1 = require("../observable/innerFrom");
var Subject_1 = require("../Subject");
var Subscriber_1 = require("../Subscriber");
var lift_1 = require("../util/lift");
function share(options) {
    if (options === void 0) { options = {}; }
    var _a = options.connector, connector = _a === void 0 ? function () { return new Subject_1.Subject(); } : _a, _b = options.resetOnError, resetOnError = _b === void 0 ? true : _b, _c = options.resetOnComplete, resetOnComplete = _c === void 0 ? true : _c, _d = options.resetOnRefCountZero, resetOnRefCountZero = _d === void 0 ? true : _d;
    return function (wrapperSource) {
        var connection;
        var resetConnection;
        var subject;
        var refCount = 0;
        var hasCompleted = false;
        var hasErrored = false;
        var cancelReset = function () {
            resetConnection === null || resetConnection === void 0 ? void 0 : resetConnection.unsubscribe();
            resetConnection = undefined;
        };
        var reset = function () {
            cancelReset();
            connection = subject = undefined;
            hasCompleted = hasErrored = false;
        };
        var resetAndUnsubscribe = function () {
            var conn = connection;
            reset();
            conn === null || conn === void 0 ? void 0 : conn.unsubscribe();
        };
        return lift_1.operate(function (source, subscriber) {
            refCount++;
            if (!hasErrored && !hasCompleted) {
                cancelReset();
            }
            var dest = (subject = subject !== null && subject !== void 0 ? subject : connector());
            subscriber.add(function () {
                refCount--;
                if (refCount === 0 && !hasErrored && !hasCompleted) {
                    resetConnection = handleReset(resetAndUnsubscribe, resetOnRefCountZero);
                }
            });
            dest.subscribe(subscriber);
            if (!connection &&
                refCount > 0) {
                connection = new Subscriber_1.SafeSubscriber({
                    next: function (value) { return dest.next(value); },
                    error: function (err) {
                        hasErrored = true;
                        cancelReset();
                        resetConnection = handleReset(reset, resetOnError, err);
                        dest.error(err);
                    },
                    complete: function () {
                        hasCompleted = true;
                        cancelReset();
                        resetConnection = handleReset(reset, resetOnComplete);
                        dest.complete();
                    },
                });
                innerFrom_1.innerFrom(source).subscribe(connection);
            }
        })(wrapperSource);
    };
}
exports.share = share;
function handleReset(reset, on) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (on === true) {
        reset();
        return;
    }
    if (on === false) {
        return;
    }
    var onSubscriber = new Subscriber_1.SafeSubscriber({
        next: function () {
            onSubscriber.unsubscribe();
            reset();
        },
    });
    return innerFrom_1.innerFrom(on.apply(void 0, __spreadArray([], __read(args)))).subscribe(onSubscriber);
}

},{"../Subject":11,"../Subscriber":12,"../observable/innerFrom":34,"../util/lift":219}],129:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareReplay = void 0;
var ReplaySubject_1 = require("../ReplaySubject");
var share_1 = require("./share");
function shareReplay(configOrBufferSize, windowTime, scheduler) {
    var _a, _b, _c;
    var bufferSize;
    var refCount = false;
    if (configOrBufferSize && typeof configOrBufferSize === 'object') {
        (_a = configOrBufferSize.bufferSize, bufferSize = _a === void 0 ? Infinity : _a, _b = configOrBufferSize.windowTime, windowTime = _b === void 0 ? Infinity : _b, _c = configOrBufferSize.refCount, refCount = _c === void 0 ? false : _c, scheduler = configOrBufferSize.scheduler);
    }
    else {
        bufferSize = (configOrBufferSize !== null && configOrBufferSize !== void 0 ? configOrBufferSize : Infinity);
    }
    return share_1.share({
        connector: function () { return new ReplaySubject_1.ReplaySubject(bufferSize, windowTime, scheduler); },
        resetOnError: true,
        resetOnComplete: false,
        resetOnRefCountZero: refCount,
    });
}
exports.shareReplay = shareReplay;

},{"../ReplaySubject":9,"./share":128}],130:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.single = void 0;
var EmptyError_1 = require("../util/EmptyError");
var SequenceError_1 = require("../util/SequenceError");
var NotFoundError_1 = require("../util/NotFoundError");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function single(predicate) {
    return lift_1.operate(function (source, subscriber) {
        var hasValue = false;
        var singleValue;
        var seenValue = false;
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            seenValue = true;
            if (!predicate || predicate(value, index++, source)) {
                hasValue && subscriber.error(new SequenceError_1.SequenceError('Too many matching values'));
                hasValue = true;
                singleValue = value;
            }
        }, function () {
            if (hasValue) {
                subscriber.next(singleValue);
                subscriber.complete();
            }
            else {
                subscriber.error(seenValue ? new NotFoundError_1.NotFoundError('No matching values') : new EmptyError_1.EmptyError());
            }
        }));
    });
}
exports.single = single;

},{"../util/EmptyError":194,"../util/NotFoundError":196,"../util/SequenceError":198,"../util/lift":219,"./OperatorSubscriber":48}],131:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skip = void 0;
var filter_1 = require("./filter");
function skip(count) {
    return filter_1.filter(function (_, index) { return count <= index; });
}
exports.skip = skip;

},{"./filter":84}],132:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipLast = void 0;
var identity_1 = require("../util/identity");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function skipLast(skipCount) {
    return skipCount <= 0
        ?
            identity_1.identity
        : lift_1.operate(function (source, subscriber) {
            var ring = new Array(skipCount);
            var seen = 0;
            source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
                var valueIndex = seen++;
                if (valueIndex < skipCount) {
                    ring[valueIndex] = value;
                }
                else {
                    var index = valueIndex % skipCount;
                    var oldValue = ring[index];
                    ring[index] = value;
                    subscriber.next(oldValue);
                }
            }));
            return function () {
                ring = null;
            };
        });
}
exports.skipLast = skipLast;

},{"../util/identity":208,"../util/lift":219,"./OperatorSubscriber":48}],133:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipUntil = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
var noop_1 = require("../util/noop");
function skipUntil(notifier) {
    return lift_1.operate(function (source, subscriber) {
        var taking = false;
        var skipSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () {
            skipSubscriber === null || skipSubscriber === void 0 ? void 0 : skipSubscriber.unsubscribe();
            taking = true;
        }, noop_1.noop);
        innerFrom_1.innerFrom(notifier).subscribe(skipSubscriber);
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) { return taking && subscriber.next(value); }));
    });
}
exports.skipUntil = skipUntil;

},{"../observable/innerFrom":34,"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],134:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipWhile = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function skipWhile(predicate) {
    return lift_1.operate(function (source, subscriber) {
        var taking = false;
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) { return (taking || (taking = !predicate(value, index++))) && subscriber.next(value); }));
    });
}
exports.skipWhile = skipWhile;

},{"../util/lift":219,"./OperatorSubscriber":48}],135:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWith = void 0;
var concat_1 = require("../observable/concat");
var args_1 = require("../util/args");
var lift_1 = require("../util/lift");
function startWith() {
    var values = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(values);
    return lift_1.operate(function (source, subscriber) {
        (scheduler ? concat_1.concat(values, source, scheduler) : concat_1.concat(values, source)).subscribe(subscriber);
    });
}
exports.startWith = startWith;

},{"../observable/concat":22,"../util/args":200,"../util/lift":219}],136:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeOn = void 0;
var lift_1 = require("../util/lift");
function subscribeOn(scheduler, delay) {
    if (delay === void 0) { delay = 0; }
    return lift_1.operate(function (source, subscriber) {
        subscriber.add(scheduler.schedule(function () { return source.subscribe(subscriber); }, delay));
    });
}
exports.subscribeOn = subscribeOn;

},{"../util/lift":219}],137:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchAll = void 0;
var switchMap_1 = require("./switchMap");
var identity_1 = require("../util/identity");
function switchAll() {
    return switchMap_1.switchMap(identity_1.identity);
}
exports.switchAll = switchAll;

},{"../util/identity":208,"./switchMap":138}],138:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchMap = void 0;
var innerFrom_1 = require("../observable/innerFrom");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function switchMap(project, resultSelector) {
    return lift_1.operate(function (source, subscriber) {
        var innerSubscriber = null;
        var index = 0;
        var isComplete = false;
        var checkComplete = function () { return isComplete && !innerSubscriber && subscriber.complete(); };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            innerSubscriber === null || innerSubscriber === void 0 ? void 0 : innerSubscriber.unsubscribe();
            var innerIndex = 0;
            var outerIndex = index++;
            innerFrom_1.innerFrom(project(value, outerIndex)).subscribe((innerSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (innerValue) { return subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue); }, function () {
                innerSubscriber = null;
                checkComplete();
            })));
        }, function () {
            isComplete = true;
            checkComplete();
        }));
    });
}
exports.switchMap = switchMap;

},{"../observable/innerFrom":34,"../util/lift":219,"./OperatorSubscriber":48}],139:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchMapTo = void 0;
var switchMap_1 = require("./switchMap");
var isFunction_1 = require("../util/isFunction");
function switchMapTo(innerObservable, resultSelector) {
    return isFunction_1.isFunction(resultSelector) ? switchMap_1.switchMap(function () { return innerObservable; }, resultSelector) : switchMap_1.switchMap(function () { return innerObservable; });
}
exports.switchMapTo = switchMapTo;

},{"../util/isFunction":212,"./switchMap":138}],140:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchScan = void 0;
var switchMap_1 = require("./switchMap");
var lift_1 = require("../util/lift");
function switchScan(accumulator, seed) {
    return lift_1.operate(function (source, subscriber) {
        var state = seed;
        switchMap_1.switchMap(function (value, index) { return accumulator(state, value, index); }, function (_, innerValue) { return ((state = innerValue), innerValue); })(source).subscribe(subscriber);
        return function () {
            state = null;
        };
    });
}
exports.switchScan = switchScan;

},{"../util/lift":219,"./switchMap":138}],141:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.take = void 0;
var empty_1 = require("../observable/empty");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function take(count) {
    return count <= 0
        ?
            function () { return empty_1.EMPTY; }
        : lift_1.operate(function (source, subscriber) {
            var seen = 0;
            source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
                if (++seen <= count) {
                    subscriber.next(value);
                    if (count <= seen) {
                        subscriber.complete();
                    }
                }
            }));
        });
}
exports.take = take;

},{"../observable/empty":26,"../util/lift":219,"./OperatorSubscriber":48}],142:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeLast = void 0;
var empty_1 = require("../observable/empty");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function takeLast(count) {
    return count <= 0
        ? function () { return empty_1.EMPTY; }
        : lift_1.operate(function (source, subscriber) {
            var buffer = [];
            source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
                buffer.push(value);
                count < buffer.length && buffer.shift();
            }, function () {
                var e_1, _a;
                try {
                    for (var buffer_1 = __values(buffer), buffer_1_1 = buffer_1.next(); !buffer_1_1.done; buffer_1_1 = buffer_1.next()) {
                        var value = buffer_1_1.value;
                        subscriber.next(value);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (buffer_1_1 && !buffer_1_1.done && (_a = buffer_1.return)) _a.call(buffer_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                subscriber.complete();
            }, undefined, function () {
                buffer = null;
            }));
        });
}
exports.takeLast = takeLast;

},{"../observable/empty":26,"../util/lift":219,"./OperatorSubscriber":48}],143:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeUntil = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
var noop_1 = require("../util/noop");
function takeUntil(notifier) {
    return lift_1.operate(function (source, subscriber) {
        innerFrom_1.innerFrom(notifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () { return subscriber.complete(); }, noop_1.noop));
        !subscriber.closed && source.subscribe(subscriber);
    });
}
exports.takeUntil = takeUntil;

},{"../observable/innerFrom":34,"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],144:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeWhile = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function takeWhile(predicate, inclusive) {
    if (inclusive === void 0) { inclusive = false; }
    return lift_1.operate(function (source, subscriber) {
        var index = 0;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var result = predicate(value, index++);
            (result || inclusive) && subscriber.next(value);
            !result && subscriber.complete();
        }));
    });
}
exports.takeWhile = takeWhile;

},{"../util/lift":219,"./OperatorSubscriber":48}],145:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tap = void 0;
var isFunction_1 = require("../util/isFunction");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var identity_1 = require("../util/identity");
function tap(observerOrNext, error, complete) {
    var tapObserver = isFunction_1.isFunction(observerOrNext) || error || complete
        ?
            { next: observerOrNext, error: error, complete: complete }
        : observerOrNext;
    return tapObserver
        ? lift_1.operate(function (source, subscriber) {
            var _a;
            (_a = tapObserver.subscribe) === null || _a === void 0 ? void 0 : _a.call(tapObserver);
            var isUnsub = true;
            source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
                var _a;
                (_a = tapObserver.next) === null || _a === void 0 ? void 0 : _a.call(tapObserver, value);
                subscriber.next(value);
            }, function () {
                var _a;
                isUnsub = false;
                (_a = tapObserver.complete) === null || _a === void 0 ? void 0 : _a.call(tapObserver);
                subscriber.complete();
            }, function (err) {
                var _a;
                isUnsub = false;
                (_a = tapObserver.error) === null || _a === void 0 ? void 0 : _a.call(tapObserver, err);
                subscriber.error(err);
            }, function () {
                var _a, _b;
                if (isUnsub) {
                    (_a = tapObserver.unsubscribe) === null || _a === void 0 ? void 0 : _a.call(tapObserver);
                }
                (_b = tapObserver.finalize) === null || _b === void 0 ? void 0 : _b.call(tapObserver);
            }));
        })
        :
            identity_1.identity;
}
exports.tap = tap;

},{"../util/identity":208,"../util/isFunction":212,"../util/lift":219,"./OperatorSubscriber":48}],146:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
function throttle(durationSelector, config) {
    return lift_1.operate(function (source, subscriber) {
        var _a = config !== null && config !== void 0 ? config : {}, _b = _a.leading, leading = _b === void 0 ? true : _b, _c = _a.trailing, trailing = _c === void 0 ? false : _c;
        var hasValue = false;
        var sendValue = null;
        var throttled = null;
        var isComplete = false;
        var endThrottling = function () {
            throttled === null || throttled === void 0 ? void 0 : throttled.unsubscribe();
            throttled = null;
            if (trailing) {
                send();
                isComplete && subscriber.complete();
            }
        };
        var cleanupThrottling = function () {
            throttled = null;
            isComplete && subscriber.complete();
        };
        var startThrottle = function (value) {
            return (throttled = innerFrom_1.innerFrom(durationSelector(value)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, endThrottling, cleanupThrottling)));
        };
        var send = function () {
            if (hasValue) {
                hasValue = false;
                var value = sendValue;
                sendValue = null;
                subscriber.next(value);
                !isComplete && startThrottle(value);
            }
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            sendValue = value;
            !(throttled && !throttled.closed) && (leading ? send() : startThrottle(value));
        }, function () {
            isComplete = true;
            !(trailing && hasValue && throttled && !throttled.closed) && subscriber.complete();
        }));
    });
}
exports.throttle = throttle;

},{"../observable/innerFrom":34,"../util/lift":219,"./OperatorSubscriber":48}],147:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttleTime = void 0;
var async_1 = require("../scheduler/async");
var throttle_1 = require("./throttle");
var timer_1 = require("../observable/timer");
function throttleTime(duration, scheduler, config) {
    if (scheduler === void 0) { scheduler = async_1.asyncScheduler; }
    var duration$ = timer_1.timer(duration, scheduler);
    return throttle_1.throttle(function () { return duration$; }, config);
}
exports.throttleTime = throttleTime;

},{"../observable/timer":45,"../scheduler/async":183,"./throttle":146}],148:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwIfEmpty = void 0;
var EmptyError_1 = require("../util/EmptyError");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function throwIfEmpty(errorFactory) {
    if (errorFactory === void 0) { errorFactory = defaultErrorFactory; }
    return lift_1.operate(function (source, subscriber) {
        var hasValue = false;
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            subscriber.next(value);
        }, function () { return (hasValue ? subscriber.complete() : subscriber.error(errorFactory())); }));
    });
}
exports.throwIfEmpty = throwIfEmpty;
function defaultErrorFactory() {
    return new EmptyError_1.EmptyError();
}

},{"../util/EmptyError":194,"../util/lift":219,"./OperatorSubscriber":48}],149:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeInterval = exports.timeInterval = void 0;
var async_1 = require("../scheduler/async");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function timeInterval(scheduler) {
    if (scheduler === void 0) { scheduler = async_1.asyncScheduler; }
    return lift_1.operate(function (source, subscriber) {
        var last = scheduler.now();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var now = scheduler.now();
            var interval = now - last;
            last = now;
            subscriber.next(new TimeInterval(value, interval));
        }));
    });
}
exports.timeInterval = timeInterval;
var TimeInterval = (function () {
    function TimeInterval(value, interval) {
        this.value = value;
        this.interval = interval;
    }
    return TimeInterval;
}());
exports.TimeInterval = TimeInterval;

},{"../scheduler/async":183,"../util/lift":219,"./OperatorSubscriber":48}],150:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeout = exports.TimeoutError = void 0;
var async_1 = require("../scheduler/async");
var isDate_1 = require("../util/isDate");
var lift_1 = require("../util/lift");
var innerFrom_1 = require("../observable/innerFrom");
var createErrorClass_1 = require("../util/createErrorClass");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var executeSchedule_1 = require("../util/executeSchedule");
exports.TimeoutError = createErrorClass_1.createErrorClass(function (_super) {
    return function TimeoutErrorImpl(info) {
        if (info === void 0) { info = null; }
        _super(this);
        this.message = 'Timeout has occurred';
        this.name = 'TimeoutError';
        this.info = info;
    };
});
function timeout(config, schedulerArg) {
    var _a = (isDate_1.isValidDate(config) ? { first: config } : typeof config === 'number' ? { each: config } : config), first = _a.first, each = _a.each, _b = _a.with, _with = _b === void 0 ? timeoutErrorFactory : _b, _c = _a.scheduler, scheduler = _c === void 0 ? schedulerArg !== null && schedulerArg !== void 0 ? schedulerArg : async_1.asyncScheduler : _c, _d = _a.meta, meta = _d === void 0 ? null : _d;
    if (first == null && each == null) {
        throw new TypeError('No timeout provided.');
    }
    return lift_1.operate(function (source, subscriber) {
        var originalSourceSubscription;
        var timerSubscription;
        var lastValue = null;
        var seen = 0;
        var startTimer = function (delay) {
            timerSubscription = executeSchedule_1.executeSchedule(subscriber, scheduler, function () {
                try {
                    originalSourceSubscription.unsubscribe();
                    innerFrom_1.innerFrom(_with({
                        meta: meta,
                        lastValue: lastValue,
                        seen: seen,
                    })).subscribe(subscriber);
                }
                catch (err) {
                    subscriber.error(err);
                }
            }, delay);
        };
        originalSourceSubscription = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
            seen++;
            subscriber.next((lastValue = value));
            each > 0 && startTimer(each);
        }, undefined, undefined, function () {
            if (!(timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.closed)) {
                timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
            }
            lastValue = null;
        }));
        !seen && startTimer(first != null ? (typeof first === 'number' ? first : +first - scheduler.now()) : each);
    });
}
exports.timeout = timeout;
function timeoutErrorFactory(info) {
    throw new exports.TimeoutError(info);
}

},{"../observable/innerFrom":34,"../scheduler/async":183,"../util/createErrorClass":204,"../util/executeSchedule":207,"../util/isDate":211,"../util/lift":219,"./OperatorSubscriber":48}],151:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeoutWith = void 0;
var async_1 = require("../scheduler/async");
var isDate_1 = require("../util/isDate");
var timeout_1 = require("./timeout");
function timeoutWith(due, withObservable, scheduler) {
    var first;
    var each;
    var _with;
    scheduler = scheduler !== null && scheduler !== void 0 ? scheduler : async_1.async;
    if (isDate_1.isValidDate(due)) {
        first = due;
    }
    else if (typeof due === 'number') {
        each = due;
    }
    if (withObservable) {
        _with = function () { return withObservable; };
    }
    else {
        throw new TypeError('No observable provided to switch to');
    }
    if (first == null && each == null) {
        throw new TypeError('No timeout provided.');
    }
    return timeout_1.timeout({
        first: first,
        each: each,
        scheduler: scheduler,
        with: _with,
    });
}
exports.timeoutWith = timeoutWith;

},{"../scheduler/async":183,"../util/isDate":211,"./timeout":150}],152:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timestamp = void 0;
var dateTimestampProvider_1 = require("../scheduler/dateTimestampProvider");
var map_1 = require("./map");
function timestamp(timestampProvider) {
    if (timestampProvider === void 0) { timestampProvider = dateTimestampProvider_1.dateTimestampProvider; }
    return map_1.map(function (value) { return ({ value: value, timestamp: timestampProvider.now() }); });
}
exports.timestamp = timestamp;

},{"../scheduler/dateTimestampProvider":184,"./map":95}],153:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toArray = void 0;
var reduce_1 = require("./reduce");
var lift_1 = require("../util/lift");
var arrReducer = function (arr, value) { return (arr.push(value), arr); };
function toArray() {
    return lift_1.operate(function (source, subscriber) {
        reduce_1.reduce(arrReducer, [])(source).subscribe(subscriber);
    });
}
exports.toArray = toArray;

},{"../util/lift":219,"./reduce":117}],154:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.window = void 0;
var Subject_1 = require("../Subject");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var noop_1 = require("../util/noop");
var innerFrom_1 = require("../observable/innerFrom");
function window(windowBoundaries) {
    return lift_1.operate(function (source, subscriber) {
        var windowSubject = new Subject_1.Subject();
        subscriber.next(windowSubject.asObservable());
        var errorHandler = function (err) {
            windowSubject.error(err);
            subscriber.error(err);
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) { return windowSubject === null || windowSubject === void 0 ? void 0 : windowSubject.next(value); }, function () {
            windowSubject.complete();
            subscriber.complete();
        }, errorHandler));
        innerFrom_1.innerFrom(windowBoundaries).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function () {
            windowSubject.complete();
            subscriber.next((windowSubject = new Subject_1.Subject()));
        }, noop_1.noop, errorHandler));
        return function () {
            windowSubject === null || windowSubject === void 0 ? void 0 : windowSubject.unsubscribe();
            windowSubject = null;
        };
    });
}
exports.window = window;

},{"../Subject":11,"../observable/innerFrom":34,"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],155:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.windowCount = void 0;
var Subject_1 = require("../Subject");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
function windowCount(windowSize, startWindowEvery) {
    if (startWindowEvery === void 0) { startWindowEvery = 0; }
    var startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize;
    return lift_1.operate(function (source, subscriber) {
        var windows = [new Subject_1.Subject()];
        var starts = [];
        var count = 0;
        subscriber.next(windows[0].asObservable());
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var e_1, _a;
            try {
                for (var windows_1 = __values(windows), windows_1_1 = windows_1.next(); !windows_1_1.done; windows_1_1 = windows_1.next()) {
                    var window_1 = windows_1_1.value;
                    window_1.next(value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (windows_1_1 && !windows_1_1.done && (_a = windows_1.return)) _a.call(windows_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var c = count - windowSize + 1;
            if (c >= 0 && c % startEvery === 0) {
                windows.shift().complete();
            }
            if (++count % startEvery === 0) {
                var window_2 = new Subject_1.Subject();
                windows.push(window_2);
                subscriber.next(window_2.asObservable());
            }
        }, function () {
            while (windows.length > 0) {
                windows.shift().complete();
            }
            subscriber.complete();
        }, function (err) {
            while (windows.length > 0) {
                windows.shift().error(err);
            }
            subscriber.error(err);
        }, function () {
            starts = null;
            windows = null;
        }));
    });
}
exports.windowCount = windowCount;

},{"../Subject":11,"../util/lift":219,"./OperatorSubscriber":48}],156:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.windowTime = void 0;
var Subject_1 = require("../Subject");
var async_1 = require("../scheduler/async");
var Subscription_1 = require("../Subscription");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var arrRemove_1 = require("../util/arrRemove");
var args_1 = require("../util/args");
var executeSchedule_1 = require("../util/executeSchedule");
function windowTime(windowTimeSpan) {
    var _a, _b;
    var otherArgs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        otherArgs[_i - 1] = arguments[_i];
    }
    var scheduler = (_a = args_1.popScheduler(otherArgs)) !== null && _a !== void 0 ? _a : async_1.asyncScheduler;
    var windowCreationInterval = (_b = otherArgs[0]) !== null && _b !== void 0 ? _b : null;
    var maxWindowSize = otherArgs[1] || Infinity;
    return lift_1.operate(function (source, subscriber) {
        var windowRecords = [];
        var restartOnClose = false;
        var closeWindow = function (record) {
            var window = record.window, subs = record.subs;
            window.complete();
            subs.unsubscribe();
            arrRemove_1.arrRemove(windowRecords, record);
            restartOnClose && startWindow();
        };
        var startWindow = function () {
            if (windowRecords) {
                var subs = new Subscription_1.Subscription();
                subscriber.add(subs);
                var window_1 = new Subject_1.Subject();
                var record_1 = {
                    window: window_1,
                    subs: subs,
                    seen: 0,
                };
                windowRecords.push(record_1);
                subscriber.next(window_1.asObservable());
                executeSchedule_1.executeSchedule(subs, scheduler, function () { return closeWindow(record_1); }, windowTimeSpan);
            }
        };
        if (windowCreationInterval !== null && windowCreationInterval >= 0) {
            executeSchedule_1.executeSchedule(subscriber, scheduler, startWindow, windowCreationInterval, true);
        }
        else {
            restartOnClose = true;
        }
        startWindow();
        var loop = function (cb) { return windowRecords.slice().forEach(cb); };
        var terminate = function (cb) {
            loop(function (_a) {
                var window = _a.window;
                return cb(window);
            });
            cb(subscriber);
            subscriber.unsubscribe();
        };
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            loop(function (record) {
                record.window.next(value);
                maxWindowSize <= ++record.seen && closeWindow(record);
            });
        }, function () { return terminate(function (consumer) { return consumer.complete(); }); }, function (err) { return terminate(function (consumer) { return consumer.error(err); }); }));
        return function () {
            windowRecords = null;
        };
    });
}
exports.windowTime = windowTime;

},{"../Subject":11,"../Subscription":13,"../scheduler/async":183,"../util/args":200,"../util/arrRemove":203,"../util/executeSchedule":207,"../util/lift":219,"./OperatorSubscriber":48}],157:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.windowToggle = void 0;
var Subject_1 = require("../Subject");
var Subscription_1 = require("../Subscription");
var lift_1 = require("../util/lift");
var innerFrom_1 = require("../observable/innerFrom");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var noop_1 = require("../util/noop");
var arrRemove_1 = require("../util/arrRemove");
function windowToggle(openings, closingSelector) {
    return lift_1.operate(function (source, subscriber) {
        var windows = [];
        var handleError = function (err) {
            while (0 < windows.length) {
                windows.shift().error(err);
            }
            subscriber.error(err);
        };
        innerFrom_1.innerFrom(openings).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (openValue) {
            var window = new Subject_1.Subject();
            windows.push(window);
            var closingSubscription = new Subscription_1.Subscription();
            var closeWindow = function () {
                arrRemove_1.arrRemove(windows, window);
                window.complete();
                closingSubscription.unsubscribe();
            };
            var closingNotifier;
            try {
                closingNotifier = innerFrom_1.innerFrom(closingSelector(openValue));
            }
            catch (err) {
                handleError(err);
                return;
            }
            subscriber.next(window.asObservable());
            closingSubscription.add(closingNotifier.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, closeWindow, noop_1.noop, handleError)));
        }, noop_1.noop));
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            var e_1, _a;
            var windowsCopy = windows.slice();
            try {
                for (var windowsCopy_1 = __values(windowsCopy), windowsCopy_1_1 = windowsCopy_1.next(); !windowsCopy_1_1.done; windowsCopy_1_1 = windowsCopy_1.next()) {
                    var window_1 = windowsCopy_1_1.value;
                    window_1.next(value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (windowsCopy_1_1 && !windowsCopy_1_1.done && (_a = windowsCopy_1.return)) _a.call(windowsCopy_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }, function () {
            while (0 < windows.length) {
                windows.shift().complete();
            }
            subscriber.complete();
        }, handleError, function () {
            while (0 < windows.length) {
                windows.shift().unsubscribe();
            }
        }));
    });
}
exports.windowToggle = windowToggle;

},{"../Subject":11,"../Subscription":13,"../observable/innerFrom":34,"../util/arrRemove":203,"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],158:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.windowWhen = void 0;
var Subject_1 = require("../Subject");
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
function windowWhen(closingSelector) {
    return lift_1.operate(function (source, subscriber) {
        var window;
        var closingSubscriber;
        var handleError = function (err) {
            window.error(err);
            subscriber.error(err);
        };
        var openWindow = function () {
            closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
            window === null || window === void 0 ? void 0 : window.complete();
            window = new Subject_1.Subject();
            subscriber.next(window.asObservable());
            var closingNotifier;
            try {
                closingNotifier = innerFrom_1.innerFrom(closingSelector());
            }
            catch (err) {
                handleError(err);
                return;
            }
            closingNotifier.subscribe((closingSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, openWindow, openWindow, handleError)));
        };
        openWindow();
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) { return window.next(value); }, function () {
            window.complete();
            subscriber.complete();
        }, handleError, function () {
            closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
            window = null;
        }));
    });
}
exports.windowWhen = windowWhen;

},{"../Subject":11,"../observable/innerFrom":34,"../util/lift":219,"./OperatorSubscriber":48}],159:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withLatestFrom = void 0;
var lift_1 = require("../util/lift");
var OperatorSubscriber_1 = require("./OperatorSubscriber");
var innerFrom_1 = require("../observable/innerFrom");
var identity_1 = require("../util/identity");
var noop_1 = require("../util/noop");
var args_1 = require("../util/args");
function withLatestFrom() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    var project = args_1.popResultSelector(inputs);
    return lift_1.operate(function (source, subscriber) {
        var len = inputs.length;
        var otherValues = new Array(len);
        var hasValue = inputs.map(function () { return false; });
        var ready = false;
        var _loop_1 = function (i) {
            innerFrom_1.innerFrom(inputs[i]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
                otherValues[i] = value;
                if (!ready && !hasValue[i]) {
                    hasValue[i] = true;
                    (ready = hasValue.every(identity_1.identity)) && (hasValue = null);
                }
            }, noop_1.noop));
        };
        for (var i = 0; i < len; i++) {
            _loop_1(i);
        }
        source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function (value) {
            if (ready) {
                var values = __spreadArray([value], __read(otherValues));
                subscriber.next(project ? project.apply(void 0, __spreadArray([], __read(values))) : values);
            }
        }));
    });
}
exports.withLatestFrom = withLatestFrom;

},{"../observable/innerFrom":34,"../util/args":200,"../util/identity":208,"../util/lift":219,"../util/noop":221,"./OperatorSubscriber":48}],160:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zip = void 0;
var zip_1 = require("../observable/zip");
var lift_1 = require("../util/lift");
function zip() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    return lift_1.operate(function (source, subscriber) {
        zip_1.zip.apply(void 0, __spreadArray([source], __read(sources))).subscribe(subscriber);
    });
}
exports.zip = zip;

},{"../observable/zip":47,"../util/lift":219}],161:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipAll = void 0;
var zip_1 = require("../observable/zip");
var joinAllInternals_1 = require("./joinAllInternals");
function zipAll(project) {
    return joinAllInternals_1.joinAllInternals(zip_1.zip, project);
}
exports.zipAll = zipAll;

},{"../observable/zip":47,"./joinAllInternals":93}],162:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipWith = void 0;
var zip_1 = require("./zip");
function zipWith() {
    var otherInputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherInputs[_i] = arguments[_i];
    }
    return zip_1.zip.apply(void 0, __spreadArray([], __read(otherInputs)));
}
exports.zipWith = zipWith;

},{"./zip":160}],163:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleArray = void 0;
var Observable_1 = require("../Observable");
function scheduleArray(input, scheduler) {
    return new Observable_1.Observable(function (subscriber) {
        var i = 0;
        return scheduler.schedule(function () {
            if (i === input.length) {
                subscriber.complete();
            }
            else {
                subscriber.next(input[i++]);
                if (!subscriber.closed) {
                    this.schedule();
                }
            }
        });
    });
}
exports.scheduleArray = scheduleArray;

},{"../Observable":8}],164:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleAsyncIterable = void 0;
var Observable_1 = require("../Observable");
var executeSchedule_1 = require("../util/executeSchedule");
function scheduleAsyncIterable(input, scheduler) {
    if (!input) {
        throw new Error('Iterable cannot be null');
    }
    return new Observable_1.Observable(function (subscriber) {
        executeSchedule_1.executeSchedule(subscriber, scheduler, function () {
            var iterator = input[Symbol.asyncIterator]();
            executeSchedule_1.executeSchedule(subscriber, scheduler, function () {
                iterator.next().then(function (result) {
                    if (result.done) {
                        subscriber.complete();
                    }
                    else {
                        subscriber.next(result.value);
                    }
                });
            }, 0, true);
        });
    });
}
exports.scheduleAsyncIterable = scheduleAsyncIterable;

},{"../Observable":8,"../util/executeSchedule":207}],165:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleIterable = void 0;
var Observable_1 = require("../Observable");
var iterator_1 = require("../symbol/iterator");
var isFunction_1 = require("../util/isFunction");
var executeSchedule_1 = require("../util/executeSchedule");
function scheduleIterable(input, scheduler) {
    return new Observable_1.Observable(function (subscriber) {
        var iterator;
        executeSchedule_1.executeSchedule(subscriber, scheduler, function () {
            iterator = input[iterator_1.iterator]();
            executeSchedule_1.executeSchedule(subscriber, scheduler, function () {
                var _a;
                var value;
                var done;
                try {
                    (_a = iterator.next(), value = _a.value, done = _a.done);
                }
                catch (err) {
                    subscriber.error(err);
                    return;
                }
                if (done) {
                    subscriber.complete();
                }
                else {
                    subscriber.next(value);
                }
            }, 0, true);
        });
        return function () { return isFunction_1.isFunction(iterator === null || iterator === void 0 ? void 0 : iterator.return) && iterator.return(); };
    });
}
exports.scheduleIterable = scheduleIterable;

},{"../Observable":8,"../symbol/iterator":190,"../util/executeSchedule":207,"../util/isFunction":212}],166:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleObservable = void 0;
var innerFrom_1 = require("../observable/innerFrom");
var observeOn_1 = require("../operators/observeOn");
var subscribeOn_1 = require("../operators/subscribeOn");
function scheduleObservable(input, scheduler) {
    return innerFrom_1.innerFrom(input).pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
}
exports.scheduleObservable = scheduleObservable;

},{"../observable/innerFrom":34,"../operators/observeOn":108,"../operators/subscribeOn":136}],167:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulePromise = void 0;
var innerFrom_1 = require("../observable/innerFrom");
var observeOn_1 = require("../operators/observeOn");
var subscribeOn_1 = require("../operators/subscribeOn");
function schedulePromise(input, scheduler) {
    return innerFrom_1.innerFrom(input).pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
}
exports.schedulePromise = schedulePromise;

},{"../observable/innerFrom":34,"../operators/observeOn":108,"../operators/subscribeOn":136}],168:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleReadableStreamLike = void 0;
var scheduleAsyncIterable_1 = require("./scheduleAsyncIterable");
var isReadableStreamLike_1 = require("../util/isReadableStreamLike");
function scheduleReadableStreamLike(input, scheduler) {
    return scheduleAsyncIterable_1.scheduleAsyncIterable(isReadableStreamLike_1.readableStreamLikeToAsyncGenerator(input), scheduler);
}
exports.scheduleReadableStreamLike = scheduleReadableStreamLike;

},{"../util/isReadableStreamLike":217,"./scheduleAsyncIterable":164}],169:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduled = void 0;
var scheduleObservable_1 = require("./scheduleObservable");
var schedulePromise_1 = require("./schedulePromise");
var scheduleArray_1 = require("./scheduleArray");
var scheduleIterable_1 = require("./scheduleIterable");
var scheduleAsyncIterable_1 = require("./scheduleAsyncIterable");
var isInteropObservable_1 = require("../util/isInteropObservable");
var isPromise_1 = require("../util/isPromise");
var isArrayLike_1 = require("../util/isArrayLike");
var isIterable_1 = require("../util/isIterable");
var isAsyncIterable_1 = require("../util/isAsyncIterable");
var throwUnobservableError_1 = require("../util/throwUnobservableError");
var isReadableStreamLike_1 = require("../util/isReadableStreamLike");
var scheduleReadableStreamLike_1 = require("./scheduleReadableStreamLike");
function scheduled(input, scheduler) {
    if (input != null) {
        if (isInteropObservable_1.isInteropObservable(input)) {
            return scheduleObservable_1.scheduleObservable(input, scheduler);
        }
        if (isArrayLike_1.isArrayLike(input)) {
            return scheduleArray_1.scheduleArray(input, scheduler);
        }
        if (isPromise_1.isPromise(input)) {
            return schedulePromise_1.schedulePromise(input, scheduler);
        }
        if (isAsyncIterable_1.isAsyncIterable(input)) {
            return scheduleAsyncIterable_1.scheduleAsyncIterable(input, scheduler);
        }
        if (isIterable_1.isIterable(input)) {
            return scheduleIterable_1.scheduleIterable(input, scheduler);
        }
        if (isReadableStreamLike_1.isReadableStreamLike(input)) {
            return scheduleReadableStreamLike_1.scheduleReadableStreamLike(input, scheduler);
        }
    }
    throw throwUnobservableError_1.createInvalidObservableTypeError(input);
}
exports.scheduled = scheduled;

},{"../util/isArrayLike":209,"../util/isAsyncIterable":210,"../util/isInteropObservable":213,"../util/isIterable":214,"../util/isPromise":216,"../util/isReadableStreamLike":217,"../util/throwUnobservableError":225,"./scheduleArray":163,"./scheduleAsyncIterable":164,"./scheduleIterable":165,"./scheduleObservable":166,"./schedulePromise":167,"./scheduleReadableStreamLike":168}],170:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Action = void 0;
var Subscription_1 = require("../Subscription");
var Action = (function (_super) {
    __extends(Action, _super);
    function Action(scheduler, work) {
        return _super.call(this) || this;
    }
    Action.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        return this;
    };
    return Action;
}(Subscription_1.Subscription));
exports.Action = Action;

},{"../Subscription":13}],171:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationFrameAction = void 0;
var AsyncAction_1 = require("./AsyncAction");
var animationFrameProvider_1 = require("./animationFrameProvider");
var AnimationFrameAction = (function (_super) {
    __extends(AnimationFrameAction, _super);
    function AnimationFrameAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    AnimationFrameAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay !== null && delay > 0) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler._scheduled || (scheduler._scheduled = animationFrameProvider_1.animationFrameProvider.requestAnimationFrame(function () { return scheduler.flush(undefined); }));
    };
    AnimationFrameAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        var _a;
        if (delay === void 0) { delay = 0; }
        if (delay != null ? delay > 0 : this.delay > 0) {
            return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        var actions = scheduler.actions;
        if (id != null && ((_a = actions[actions.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== id) {
            animationFrameProvider_1.animationFrameProvider.cancelAnimationFrame(id);
            scheduler._scheduled = undefined;
        }
        return undefined;
    };
    return AnimationFrameAction;
}(AsyncAction_1.AsyncAction));
exports.AnimationFrameAction = AnimationFrameAction;

},{"./AsyncAction":175,"./animationFrameProvider":181}],172:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationFrameScheduler = void 0;
var AsyncScheduler_1 = require("./AsyncScheduler");
var AnimationFrameScheduler = (function (_super) {
    __extends(AnimationFrameScheduler, _super);
    function AnimationFrameScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AnimationFrameScheduler.prototype.flush = function (action) {
        this._active = true;
        var flushId = this._scheduled;
        this._scheduled = undefined;
        var actions = this.actions;
        var error;
        action = action || actions.shift();
        do {
            if ((error = action.execute(action.state, action.delay))) {
                break;
            }
        } while ((action = actions[0]) && action.id === flushId && actions.shift());
        this._active = false;
        if (error) {
            while ((action = actions[0]) && action.id === flushId && actions.shift()) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AnimationFrameScheduler;
}(AsyncScheduler_1.AsyncScheduler));
exports.AnimationFrameScheduler = AnimationFrameScheduler;

},{"./AsyncScheduler":176}],173:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsapAction = void 0;
var AsyncAction_1 = require("./AsyncAction");
var immediateProvider_1 = require("./immediateProvider");
var AsapAction = (function (_super) {
    __extends(AsapAction, _super);
    function AsapAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    AsapAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay !== null && delay > 0) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler._scheduled || (scheduler._scheduled = immediateProvider_1.immediateProvider.setImmediate(scheduler.flush.bind(scheduler, undefined)));
    };
    AsapAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        var _a;
        if (delay === void 0) { delay = 0; }
        if (delay != null ? delay > 0 : this.delay > 0) {
            return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        var actions = scheduler.actions;
        if (id != null && ((_a = actions[actions.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== id) {
            immediateProvider_1.immediateProvider.clearImmediate(id);
            if (scheduler._scheduled === id) {
                scheduler._scheduled = undefined;
            }
        }
        return undefined;
    };
    return AsapAction;
}(AsyncAction_1.AsyncAction));
exports.AsapAction = AsapAction;

},{"./AsyncAction":175,"./immediateProvider":185}],174:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsapScheduler = void 0;
var AsyncScheduler_1 = require("./AsyncScheduler");
var AsapScheduler = (function (_super) {
    __extends(AsapScheduler, _super);
    function AsapScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsapScheduler.prototype.flush = function (action) {
        this._active = true;
        var flushId = this._scheduled;
        this._scheduled = undefined;
        var actions = this.actions;
        var error;
        action = action || actions.shift();
        do {
            if ((error = action.execute(action.state, action.delay))) {
                break;
            }
        } while ((action = actions[0]) && action.id === flushId && actions.shift());
        this._active = false;
        if (error) {
            while ((action = actions[0]) && action.id === flushId && actions.shift()) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AsapScheduler;
}(AsyncScheduler_1.AsyncScheduler));
exports.AsapScheduler = AsapScheduler;

},{"./AsyncScheduler":176}],175:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncAction = void 0;
var Action_1 = require("./Action");
var intervalProvider_1 = require("./intervalProvider");
var arrRemove_1 = require("../util/arrRemove");
var AsyncAction = (function (_super) {
    __extends(AsyncAction, _super);
    function AsyncAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.pending = false;
        return _this;
    }
    AsyncAction.prototype.schedule = function (state, delay) {
        var _a;
        if (delay === void 0) { delay = 0; }
        if (this.closed) {
            return this;
        }
        this.state = state;
        var id = this.id;
        var scheduler = this.scheduler;
        if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, delay);
        }
        this.pending = true;
        this.delay = delay;
        this.id = (_a = this.id) !== null && _a !== void 0 ? _a : this.requestAsyncId(scheduler, this.id, delay);
        return this;
    };
    AsyncAction.prototype.requestAsyncId = function (scheduler, _id, delay) {
        if (delay === void 0) { delay = 0; }
        return intervalProvider_1.intervalProvider.setInterval(scheduler.flush.bind(scheduler, this), delay);
    };
    AsyncAction.prototype.recycleAsyncId = function (_scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay != null && this.delay === delay && this.pending === false) {
            return id;
        }
        if (id != null) {
            intervalProvider_1.intervalProvider.clearInterval(id);
        }
        return undefined;
    };
    AsyncAction.prototype.execute = function (state, delay) {
        if (this.closed) {
            return new Error('executing a cancelled action');
        }
        this.pending = false;
        var error = this._execute(state, delay);
        if (error) {
            return error;
        }
        else if (this.pending === false && this.id != null) {
            this.id = this.recycleAsyncId(this.scheduler, this.id, null);
        }
    };
    AsyncAction.prototype._execute = function (state, _delay) {
        var errored = false;
        var errorValue;
        try {
            this.work(state);
        }
        catch (e) {
            errored = true;
            errorValue = e ? e : new Error('Scheduled action threw falsy error');
        }
        if (errored) {
            this.unsubscribe();
            return errorValue;
        }
    };
    AsyncAction.prototype.unsubscribe = function () {
        if (!this.closed) {
            var _a = this, id = _a.id, scheduler = _a.scheduler;
            var actions = scheduler.actions;
            this.work = this.state = this.scheduler = null;
            this.pending = false;
            arrRemove_1.arrRemove(actions, this);
            if (id != null) {
                this.id = this.recycleAsyncId(scheduler, id, null);
            }
            this.delay = null;
            _super.prototype.unsubscribe.call(this);
        }
    };
    return AsyncAction;
}(Action_1.Action));
exports.AsyncAction = AsyncAction;

},{"../util/arrRemove":203,"./Action":170,"./intervalProvider":186}],176:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncScheduler = void 0;
var Scheduler_1 = require("../Scheduler");
var AsyncScheduler = (function (_super) {
    __extends(AsyncScheduler, _super);
    function AsyncScheduler(SchedulerAction, now) {
        if (now === void 0) { now = Scheduler_1.Scheduler.now; }
        var _this = _super.call(this, SchedulerAction, now) || this;
        _this.actions = [];
        _this._active = false;
        return _this;
    }
    AsyncScheduler.prototype.flush = function (action) {
        var actions = this.actions;
        if (this._active) {
            actions.push(action);
            return;
        }
        var error;
        this._active = true;
        do {
            if ((error = action.execute(action.state, action.delay))) {
                break;
            }
        } while ((action = actions.shift()));
        this._active = false;
        if (error) {
            while ((action = actions.shift())) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AsyncScheduler;
}(Scheduler_1.Scheduler));
exports.AsyncScheduler = AsyncScheduler;

},{"../Scheduler":10}],177:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueAction = void 0;
var AsyncAction_1 = require("./AsyncAction");
var QueueAction = (function (_super) {
    __extends(QueueAction, _super);
    function QueueAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    QueueAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay > 0) {
            return _super.prototype.schedule.call(this, state, delay);
        }
        this.delay = delay;
        this.state = state;
        this.scheduler.flush(this);
        return this;
    };
    QueueAction.prototype.execute = function (state, delay) {
        return delay > 0 || this.closed ? _super.prototype.execute.call(this, state, delay) : this._execute(state, delay);
    };
    QueueAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.flush(this);
        return 0;
    };
    return QueueAction;
}(AsyncAction_1.AsyncAction));
exports.QueueAction = QueueAction;

},{"./AsyncAction":175}],178:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueScheduler = void 0;
var AsyncScheduler_1 = require("./AsyncScheduler");
var QueueScheduler = (function (_super) {
    __extends(QueueScheduler, _super);
    function QueueScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return QueueScheduler;
}(AsyncScheduler_1.AsyncScheduler));
exports.QueueScheduler = QueueScheduler;

},{"./AsyncScheduler":176}],179:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualAction = exports.VirtualTimeScheduler = void 0;
var AsyncAction_1 = require("./AsyncAction");
var Subscription_1 = require("../Subscription");
var AsyncScheduler_1 = require("./AsyncScheduler");
var VirtualTimeScheduler = (function (_super) {
    __extends(VirtualTimeScheduler, _super);
    function VirtualTimeScheduler(schedulerActionCtor, maxFrames) {
        if (schedulerActionCtor === void 0) { schedulerActionCtor = VirtualAction; }
        if (maxFrames === void 0) { maxFrames = Infinity; }
        var _this = _super.call(this, schedulerActionCtor, function () { return _this.frame; }) || this;
        _this.maxFrames = maxFrames;
        _this.frame = 0;
        _this.index = -1;
        return _this;
    }
    VirtualTimeScheduler.prototype.flush = function () {
        var _a = this, actions = _a.actions, maxFrames = _a.maxFrames;
        var error;
        var action;
        while ((action = actions[0]) && action.delay <= maxFrames) {
            actions.shift();
            this.frame = action.delay;
            if ((error = action.execute(action.state, action.delay))) {
                break;
            }
        }
        if (error) {
            while ((action = actions.shift())) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    VirtualTimeScheduler.frameTimeFactor = 10;
    return VirtualTimeScheduler;
}(AsyncScheduler_1.AsyncScheduler));
exports.VirtualTimeScheduler = VirtualTimeScheduler;
var VirtualAction = (function (_super) {
    __extends(VirtualAction, _super);
    function VirtualAction(scheduler, work, index) {
        if (index === void 0) { index = (scheduler.index += 1); }
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.index = index;
        _this.active = true;
        _this.index = scheduler.index = index;
        return _this;
    }
    VirtualAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (Number.isFinite(delay)) {
            if (!this.id) {
                return _super.prototype.schedule.call(this, state, delay);
            }
            this.active = false;
            var action = new VirtualAction(this.scheduler, this.work);
            this.add(action);
            return action.schedule(state, delay);
        }
        else {
            return Subscription_1.Subscription.EMPTY;
        }
    };
    VirtualAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        this.delay = scheduler.frame + delay;
        var actions = scheduler.actions;
        actions.push(this);
        actions.sort(VirtualAction.sortActions);
        return 1;
    };
    VirtualAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        return undefined;
    };
    VirtualAction.prototype._execute = function (state, delay) {
        if (this.active === true) {
            return _super.prototype._execute.call(this, state, delay);
        }
    };
    VirtualAction.sortActions = function (a, b) {
        if (a.delay === b.delay) {
            if (a.index === b.index) {
                return 0;
            }
            else if (a.index > b.index) {
                return 1;
            }
            else {
                return -1;
            }
        }
        else if (a.delay > b.delay) {
            return 1;
        }
        else {
            return -1;
        }
    };
    return VirtualAction;
}(AsyncAction_1.AsyncAction));
exports.VirtualAction = VirtualAction;

},{"../Subscription":13,"./AsyncAction":175,"./AsyncScheduler":176}],180:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.animationFrame = exports.animationFrameScheduler = void 0;
var AnimationFrameAction_1 = require("./AnimationFrameAction");
var AnimationFrameScheduler_1 = require("./AnimationFrameScheduler");
exports.animationFrameScheduler = new AnimationFrameScheduler_1.AnimationFrameScheduler(AnimationFrameAction_1.AnimationFrameAction);
exports.animationFrame = exports.animationFrameScheduler;

},{"./AnimationFrameAction":171,"./AnimationFrameScheduler":172}],181:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.animationFrameProvider = void 0;
var Subscription_1 = require("../Subscription");
exports.animationFrameProvider = {
    schedule: function (callback) {
        var request = requestAnimationFrame;
        var cancel = cancelAnimationFrame;
        var delegate = exports.animationFrameProvider.delegate;
        if (delegate) {
            request = delegate.requestAnimationFrame;
            cancel = delegate.cancelAnimationFrame;
        }
        var handle = request(function (timestamp) {
            cancel = undefined;
            callback(timestamp);
        });
        return new Subscription_1.Subscription(function () { return cancel === null || cancel === void 0 ? void 0 : cancel(handle); });
    },
    requestAnimationFrame: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var delegate = exports.animationFrameProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.requestAnimationFrame) || requestAnimationFrame).apply(void 0, __spreadArray([], __read(args)));
    },
    cancelAnimationFrame: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var delegate = exports.animationFrameProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.cancelAnimationFrame) || cancelAnimationFrame).apply(void 0, __spreadArray([], __read(args)));
    },
    delegate: undefined,
};

},{"../Subscription":13}],182:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asap = exports.asapScheduler = void 0;
var AsapAction_1 = require("./AsapAction");
var AsapScheduler_1 = require("./AsapScheduler");
exports.asapScheduler = new AsapScheduler_1.AsapScheduler(AsapAction_1.AsapAction);
exports.asap = exports.asapScheduler;

},{"./AsapAction":173,"./AsapScheduler":174}],183:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.async = exports.asyncScheduler = void 0;
var AsyncAction_1 = require("./AsyncAction");
var AsyncScheduler_1 = require("./AsyncScheduler");
exports.asyncScheduler = new AsyncScheduler_1.AsyncScheduler(AsyncAction_1.AsyncAction);
exports.async = exports.asyncScheduler;

},{"./AsyncAction":175,"./AsyncScheduler":176}],184:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateTimestampProvider = void 0;
exports.dateTimestampProvider = {
    now: function () {
        return (exports.dateTimestampProvider.delegate || Date).now();
    },
    delegate: undefined,
};

},{}],185:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.immediateProvider = void 0;
var Immediate_1 = require("../util/Immediate");
var setImmediate = Immediate_1.Immediate.setImmediate, clearImmediate = Immediate_1.Immediate.clearImmediate;
exports.immediateProvider = {
    setImmediate: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var delegate = exports.immediateProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.setImmediate) || setImmediate).apply(void 0, __spreadArray([], __read(args)));
    },
    clearImmediate: function (handle) {
        var delegate = exports.immediateProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearImmediate) || clearImmediate)(handle);
    },
    delegate: undefined,
};

},{"../util/Immediate":195}],186:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.intervalProvider = void 0;
exports.intervalProvider = {
    setInterval: function (handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var delegate = exports.intervalProvider.delegate;
        if (delegate === null || delegate === void 0 ? void 0 : delegate.setInterval) {
            return delegate.setInterval.apply(delegate, __spreadArray([handler, timeout], __read(args)));
        }
        return setInterval.apply(void 0, __spreadArray([handler, timeout], __read(args)));
    },
    clearInterval: function (handle) {
        var delegate = exports.intervalProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearInterval) || clearInterval)(handle);
    },
    delegate: undefined,
};

},{}],187:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceTimestampProvider = void 0;
exports.performanceTimestampProvider = {
    now: function () {
        return (exports.performanceTimestampProvider.delegate || performance).now();
    },
    delegate: undefined,
};

},{}],188:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queue = exports.queueScheduler = void 0;
var QueueAction_1 = require("./QueueAction");
var QueueScheduler_1 = require("./QueueScheduler");
exports.queueScheduler = new QueueScheduler_1.QueueScheduler(QueueAction_1.QueueAction);
exports.queue = exports.queueScheduler;

},{"./QueueAction":177,"./QueueScheduler":178}],189:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeoutProvider = void 0;
exports.timeoutProvider = {
    setTimeout: function (handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var delegate = exports.timeoutProvider.delegate;
        if (delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) {
            return delegate.setTimeout.apply(delegate, __spreadArray([handler, timeout], __read(args)));
        }
        return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
    },
    clearTimeout: function (handle) {
        var delegate = exports.timeoutProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
    },
    delegate: undefined,
};

},{}],190:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iterator = exports.getSymbolIterator = void 0;
function getSymbolIterator() {
    if (typeof Symbol !== 'function' || !Symbol.iterator) {
        return '@@iterator';
    }
    return Symbol.iterator;
}
exports.getSymbolIterator = getSymbolIterator;
exports.iterator = getSymbolIterator();

},{}],191:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observable = void 0;
exports.observable = (function () { return (typeof Symbol === 'function' && Symbol.observable) || '@@observable'; })();

},{}],192:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],193:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgumentOutOfRangeError = void 0;
var createErrorClass_1 = require("./createErrorClass");
exports.ArgumentOutOfRangeError = createErrorClass_1.createErrorClass(function (_super) {
    return function ArgumentOutOfRangeErrorImpl() {
        _super(this);
        this.name = 'ArgumentOutOfRangeError';
        this.message = 'argument out of range';
    };
});

},{"./createErrorClass":204}],194:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyError = void 0;
var createErrorClass_1 = require("./createErrorClass");
exports.EmptyError = createErrorClass_1.createErrorClass(function (_super) { return function EmptyErrorImpl() {
    _super(this);
    this.name = 'EmptyError';
    this.message = 'no elements in sequence';
}; });

},{"./createErrorClass":204}],195:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestTools = exports.Immediate = void 0;
var nextHandle = 1;
var resolved;
var activeHandles = {};
function findAndClearHandle(handle) {
    if (handle in activeHandles) {
        delete activeHandles[handle];
        return true;
    }
    return false;
}
exports.Immediate = {
    setImmediate: function (cb) {
        var handle = nextHandle++;
        activeHandles[handle] = true;
        if (!resolved) {
            resolved = Promise.resolve();
        }
        resolved.then(function () { return findAndClearHandle(handle) && cb(); });
        return handle;
    },
    clearImmediate: function (handle) {
        findAndClearHandle(handle);
    },
};
exports.TestTools = {
    pending: function () {
        return Object.keys(activeHandles).length;
    }
};

},{}],196:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
var createErrorClass_1 = require("./createErrorClass");
exports.NotFoundError = createErrorClass_1.createErrorClass(function (_super) {
    return function NotFoundErrorImpl(message) {
        _super(this);
        this.name = 'NotFoundError';
        this.message = message;
    };
});

},{"./createErrorClass":204}],197:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectUnsubscribedError = void 0;
var createErrorClass_1 = require("./createErrorClass");
exports.ObjectUnsubscribedError = createErrorClass_1.createErrorClass(function (_super) {
    return function ObjectUnsubscribedErrorImpl() {
        _super(this);
        this.name = 'ObjectUnsubscribedError';
        this.message = 'object unsubscribed';
    };
});

},{"./createErrorClass":204}],198:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequenceError = void 0;
var createErrorClass_1 = require("./createErrorClass");
exports.SequenceError = createErrorClass_1.createErrorClass(function (_super) {
    return function SequenceErrorImpl(message) {
        _super(this);
        this.name = 'SequenceError';
        this.message = message;
    };
});

},{"./createErrorClass":204}],199:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsubscriptionError = void 0;
var createErrorClass_1 = require("./createErrorClass");
exports.UnsubscriptionError = createErrorClass_1.createErrorClass(function (_super) {
    return function UnsubscriptionErrorImpl(errors) {
        _super(this);
        this.message = errors
            ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ')
            : '';
        this.name = 'UnsubscriptionError';
        this.errors = errors;
    };
});

},{"./createErrorClass":204}],200:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.popNumber = exports.popScheduler = exports.popResultSelector = void 0;
var isFunction_1 = require("./isFunction");
var isScheduler_1 = require("./isScheduler");
function last(arr) {
    return arr[arr.length - 1];
}
function popResultSelector(args) {
    return isFunction_1.isFunction(last(args)) ? args.pop() : undefined;
}
exports.popResultSelector = popResultSelector;
function popScheduler(args) {
    return isScheduler_1.isScheduler(last(args)) ? args.pop() : undefined;
}
exports.popScheduler = popScheduler;
function popNumber(args, defaultValue) {
    return typeof last(args) === 'number' ? args.pop() : defaultValue;
}
exports.popNumber = popNumber;

},{"./isFunction":212,"./isScheduler":218}],201:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.argsArgArrayOrObject = void 0;
var isArray = Array.isArray;
var getPrototypeOf = Object.getPrototypeOf, objectProto = Object.prototype, getKeys = Object.keys;
function argsArgArrayOrObject(args) {
    if (args.length === 1) {
        var first_1 = args[0];
        if (isArray(first_1)) {
            return { args: first_1, keys: null };
        }
        if (isPOJO(first_1)) {
            var keys = getKeys(first_1);
            return {
                args: keys.map(function (key) { return first_1[key]; }),
                keys: keys,
            };
        }
    }
    return { args: args, keys: null };
}
exports.argsArgArrayOrObject = argsArgArrayOrObject;
function isPOJO(obj) {
    return obj && typeof obj === 'object' && getPrototypeOf(obj) === objectProto;
}

},{}],202:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.argsOrArgArray = void 0;
var isArray = Array.isArray;
function argsOrArgArray(args) {
    return args.length === 1 && isArray(args[0]) ? args[0] : args;
}
exports.argsOrArgArray = argsOrArgArray;

},{}],203:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrRemove = void 0;
function arrRemove(arr, item) {
    if (arr) {
        var index = arr.indexOf(item);
        0 <= index && arr.splice(index, 1);
    }
}
exports.arrRemove = arrRemove;

},{}],204:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorClass = void 0;
function createErrorClass(createImpl) {
    var _super = function (instance) {
        Error.call(instance);
        instance.stack = new Error().stack;
    };
    var ctorFunc = createImpl(_super);
    ctorFunc.prototype = Object.create(Error.prototype);
    ctorFunc.prototype.constructor = ctorFunc;
    return ctorFunc;
}
exports.createErrorClass = createErrorClass;

},{}],205:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createObject = void 0;
function createObject(keys, values) {
    return keys.reduce(function (result, key, i) { return ((result[key] = values[i]), result); }, {});
}
exports.createObject = createObject;

},{}],206:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureError = exports.errorContext = void 0;
var config_1 = require("../config");
var context = null;
function errorContext(cb) {
    if (config_1.config.useDeprecatedSynchronousErrorHandling) {
        var isRoot = !context;
        if (isRoot) {
            context = { errorThrown: false, error: null };
        }
        cb();
        if (isRoot) {
            var _a = context, errorThrown = _a.errorThrown, error = _a.error;
            context = null;
            if (errorThrown) {
                throw error;
            }
        }
    }
    else {
        cb();
    }
}
exports.errorContext = errorContext;
function captureError(err) {
    if (config_1.config.useDeprecatedSynchronousErrorHandling && context) {
        context.errorThrown = true;
        context.error = err;
    }
}
exports.captureError = captureError;

},{"../config":14}],207:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSchedule = void 0;
function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
    if (delay === void 0) { delay = 0; }
    if (repeat === void 0) { repeat = false; }
    var scheduleSubscription = scheduler.schedule(function () {
        work();
        if (repeat) {
            parentSubscription.add(this.schedule(null, delay));
        }
        else {
            this.unsubscribe();
        }
    }, delay);
    parentSubscription.add(scheduleSubscription);
    if (!repeat) {
        return scheduleSubscription;
    }
}
exports.executeSchedule = executeSchedule;

},{}],208:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identity = void 0;
function identity(x) {
    return x;
}
exports.identity = identity;

},{}],209:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArrayLike = void 0;
exports.isArrayLike = (function (x) { return x && typeof x.length === 'number' && typeof x !== 'function'; });

},{}],210:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAsyncIterable = void 0;
var isFunction_1 = require("./isFunction");
function isAsyncIterable(obj) {
    return Symbol.asyncIterator && isFunction_1.isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
}
exports.isAsyncIterable = isAsyncIterable;

},{"./isFunction":212}],211:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidDate = void 0;
function isValidDate(value) {
    return value instanceof Date && !isNaN(value);
}
exports.isValidDate = isValidDate;

},{}],212:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFunction = void 0;
function isFunction(value) {
    return typeof value === 'function';
}
exports.isFunction = isFunction;

},{}],213:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInteropObservable = void 0;
var observable_1 = require("../symbol/observable");
var isFunction_1 = require("./isFunction");
function isInteropObservable(input) {
    return isFunction_1.isFunction(input[observable_1.observable]);
}
exports.isInteropObservable = isInteropObservable;

},{"../symbol/observable":191,"./isFunction":212}],214:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIterable = void 0;
var iterator_1 = require("../symbol/iterator");
var isFunction_1 = require("./isFunction");
function isIterable(input) {
    return isFunction_1.isFunction(input === null || input === void 0 ? void 0 : input[iterator_1.iterator]);
}
exports.isIterable = isIterable;

},{"../symbol/iterator":190,"./isFunction":212}],215:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObservable = void 0;
var Observable_1 = require("../Observable");
var isFunction_1 = require("./isFunction");
function isObservable(obj) {
    return !!obj && (obj instanceof Observable_1.Observable || (isFunction_1.isFunction(obj.lift) && isFunction_1.isFunction(obj.subscribe)));
}
exports.isObservable = isObservable;

},{"../Observable":8,"./isFunction":212}],216:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPromise = void 0;
var isFunction_1 = require("./isFunction");
function isPromise(value) {
    return isFunction_1.isFunction(value === null || value === void 0 ? void 0 : value.then);
}
exports.isPromise = isPromise;

},{"./isFunction":212}],217:[function(require,module,exports){
"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReadableStreamLike = exports.readableStreamLikeToAsyncGenerator = void 0;
var isFunction_1 = require("./isFunction");
function readableStreamLikeToAsyncGenerator(readableStream) {
    return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
        var reader, _a, value, done;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    reader = readableStream.getReader();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 9, 10]);
                    _b.label = 2;
                case 2:
                    if (!true) return [3, 8];
                    return [4, __await(reader.read())];
                case 3:
                    _a = _b.sent(), value = _a.value, done = _a.done;
                    if (!done) return [3, 5];
                    return [4, __await(void 0)];
                case 4: return [2, _b.sent()];
                case 5: return [4, __await(value)];
                case 6: return [4, _b.sent()];
                case 7:
                    _b.sent();
                    return [3, 2];
                case 8: return [3, 10];
                case 9:
                    reader.releaseLock();
                    return [7];
                case 10: return [2];
            }
        });
    });
}
exports.readableStreamLikeToAsyncGenerator = readableStreamLikeToAsyncGenerator;
function isReadableStreamLike(obj) {
    return isFunction_1.isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
}
exports.isReadableStreamLike = isReadableStreamLike;

},{"./isFunction":212}],218:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isScheduler = void 0;
var isFunction_1 = require("./isFunction");
function isScheduler(value) {
    return value && isFunction_1.isFunction(value.schedule);
}
exports.isScheduler = isScheduler;

},{"./isFunction":212}],219:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operate = exports.hasLift = void 0;
var isFunction_1 = require("./isFunction");
function hasLift(source) {
    return isFunction_1.isFunction(source === null || source === void 0 ? void 0 : source.lift);
}
exports.hasLift = hasLift;
function operate(init) {
    return function (source) {
        if (hasLift(source)) {
            return source.lift(function (liftedSource) {
                try {
                    return init(liftedSource, this);
                }
                catch (err) {
                    this.error(err);
                }
            });
        }
        throw new TypeError('Unable to lift unknown Observable type');
    };
}
exports.operate = operate;

},{"./isFunction":212}],220:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapOneOrManyArgs = void 0;
var map_1 = require("../operators/map");
var isArray = Array.isArray;
function callOrApply(fn, args) {
    return isArray(args) ? fn.apply(void 0, __spreadArray([], __read(args))) : fn(args);
}
function mapOneOrManyArgs(fn) {
    return map_1.map(function (args) { return callOrApply(fn, args); });
}
exports.mapOneOrManyArgs = mapOneOrManyArgs;

},{"../operators/map":95}],221:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noop = void 0;
function noop() { }
exports.noop = noop;

},{}],222:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.not = void 0;
function not(pred, thisArg) {
    return function (value, index) { return !pred.call(thisArg, value, index); };
}
exports.not = not;

},{}],223:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipeFromArray = exports.pipe = void 0;
var identity_1 = require("./identity");
function pipe() {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
    }
    return pipeFromArray(fns);
}
exports.pipe = pipe;
function pipeFromArray(fns) {
    if (fns.length === 0) {
        return identity_1.identity;
    }
    if (fns.length === 1) {
        return fns[0];
    }
    return function piped(input) {
        return fns.reduce(function (prev, fn) { return fn(prev); }, input);
    };
}
exports.pipeFromArray = pipeFromArray;

},{"./identity":208}],224:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportUnhandledError = void 0;
var config_1 = require("../config");
var timeoutProvider_1 = require("../scheduler/timeoutProvider");
function reportUnhandledError(err) {
    timeoutProvider_1.timeoutProvider.setTimeout(function () {
        var onUnhandledError = config_1.config.onUnhandledError;
        if (onUnhandledError) {
            onUnhandledError(err);
        }
        else {
            throw err;
        }
    });
}
exports.reportUnhandledError = reportUnhandledError;

},{"../config":14,"../scheduler/timeoutProvider":189}],225:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvalidObservableTypeError = void 0;
function createInvalidObservableTypeError(input) {
    return new TypeError("You provided " + (input !== null && typeof input === 'object' ? 'an invalid object' : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
exports.createInvalidObservableTypeError = createInvalidObservableTypeError;

},{}],226:[function(require,module,exports){
exports.SentimentIntensityAnalyzer=function(e){var s={};function i(r){if(s[r])return s[r].exports;var t=s[r]={i:r,l:!1,exports:{}};return e[r].call(t.exports,t,t.exports,i),t.l=!0,t.exports}return i.m=e,i.c=s,i.d=function(e,s,r){i.o(e,s)||Object.defineProperty(e,s,{configurable:!1,enumerable:!0,get:r})},i.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},i.n=function(e){var s=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(s,"a",s),s},i.o=function(e,s){return Object.prototype.hasOwnProperty.call(e,s)},i.p="",i(i.s=2)}([function(e,s,i){"use strict";Object.defineProperty(s,"__esModule",{value:!0});s.lexicon={"$:":-1.5,"%)":-.4,"%-)":-1.5,"&-:":-.4,"&:":-.7,"( '}{' )":1.6,"(%":-.9,"('-:":2.2,"(':":2.3,"((-:":2.1,"(*":1.1,"(-%":-.7,"(-*":1.3,"(-:":1.6,"(-:0":2.8,"(-:<":-.4,"(-:o":1.5,"(-:O":1.5,"(-:{":-.1,"(-:|>*":1.9,"(-;":1.3,"(-;|":2.1,"(8":2.6,"(:":2.2,"(:0":2.4,"(:<":-.2,"(:o":2.5,"(:O":2.5,"(;":1.1,"(;<":.3,"(=":2.2,"(?:":2.1,"(^:":1.5,"(^;":1.5,"(^;0":2,"(^;o":1.9,"(o:":1.6,")':":-2,")-':":-2.1,")-:":-2.1,")-:<":-2.2,")-:{":-2.1,"):":-1.8,"):<":-1.9,"):{":-2.3,");<":-2.6,"*)":.6,"*-)":.3,"*-:":2.1,"*-;":2.4,"*:":1.9,"*<|:-)":1.6,"*\\0/*":2.3,"*^:":1.6,",-:":1.2,"---'-;-{@":2.3,"--<--<@":2.2,".-:":-1.2,"..###-:":-1.7,"..###:":-1.9,"/-:":-1.3,"/:":-1.3,"/:<":-1.4,"/=":-.9,"/^:":-1,"/o:":-1.4,"0-8":.1,"0-|":-1.2,"0:)":1.9,"0:-)":1.4,"0:-3":1.5,"0:03":1.9,"0;^)":1.6,"0_o":-.3,"10q":2.1,1337:2.1,143:3.2,1432:2.6,"14aa41":2.4,182:-2.9,187:-3.1,"2g2b4g":2.8,"2g2bt":-.1,"2qt":2.1,"3:(":-2.2,"3:)":.5,"3:-(":-2.3,"3:-)":-1.4,"4col":-2.2,"4q":-3.1,"5fs":1.5,"8)":1.9,"8-d":1.7,"8-o":-.3,86:-1.6,"8d":2.9,":###..":-2.4,":$":-.2,":&":-.6,":'(":-2.2,":')":2.3,":'-(":-2.4,":'-)":2.7,":(":-1.9,":)":2,":*":2.5,":-###..":-2.5,":-&":-.5,":-(":-1.5,":-)":1.3,":-))":2.8,":-*":1.7,":-,":1.1,":-.":-.9,":-/":-1.2,":-<":-1.5,":-d":2.3,":-D":2.3,":-o":.1,":-[":-1.6,":-\\":-.9,":-c":-1.3,":-p":1.5,":-|":-.7,":-||":-2.5,":-Þ":.9,":/":-1.4,":3":2.3,":<":-2.1,":>":2.1,":?)":1.3,":?c":-1.6,":@":-2.5,":d":2.3,":D":2.3,":l":-1.7,":o":-.4,":p":1,":s":-1.2,":[":-2,":\\":-1.3,":]":2.2,":^)":2.1,":^*":2.6,":^/":-1.2,":^\\":-1,":^|":-1,":c":-2.1,":c)":2,":o)":2.1,":o/":-1.4,":o\\":-1.1,":o|":-.6,":P":1.4,":{":-1.9,":|":-.4,":}":2.1,":Þ":1.1,";)":.9,";-)":1,";-*":2.2,";-]":.7,";d":.8,";D":.8,";]":.6,";^)":1.4,"</3":-3,"<3":1.9,"<:":2.1,"<:-|":-1.4,"=)":2.2,"=-3":2,"=-d":2.4,"=-D":2.4,"=/":-1.4,"=3":2.1,"=d":2.3,"=D":2.3,"=l":-1.2,"=\\":-1.2,"=]":1.6,"=p":1.3,"=|":-.8,">-:":-2,">.<":-1.3,">:":-2.1,">:(":-2.7,">:)":.4,">:-(":-2.7,">:-)":-.4,">:/":-1.6,">:o":-1.2,">:p":1,">:[":-2.1,">:\\":-1.7,">;(":-2.9,">;)":.1,">_>^":2.1,"@:":-2.1,"@>--\x3e--":2.1,"@}-;-'---":2.2,aas:2.5,aayf:2.7,afu:-2.9,alol:2.8,ambw:2.9,aml:3.4,atab:-1.9,awol:-1.3,ayc:.2,ayor:-1.2,"aug-00":.3,bfd:-2.7,bfe:-2.6,bff:2.9,bffn:1,bl:2.3,bsod:-2.2,btd:-2.1,btdt:-.1,bz:.4,"b^d":2.6,cwot:-2.3,"d-':":-2.5,d8:-3.2,"d:<":-3.2,"d;":-2.9,doa:-2.3,dx:-3,ez:1.5,fcol:-1.8,ff:1.8,ffs:-2.8,fkm:-2.4,foaf:1.8,ftw:2,fu:-3.7,fubar:-3,fwb:2.5,fyi:.8,fysa:.4,g1:1.4,gg:1.2,gga:1.7,gigo:-.6,gj:2,gl:1.3,gla:2.5,gn:1.2,gr8:2.7,grrr:-.4,gt:1.1,"h&k":2.3,hagd:2.2,hagn:2.2,hago:1.2,hak:1.9,hand:2.2,"hho1/2k":1.4,hhoj:2,hhok:.9,hugz:2,hi5:1.9,idk:-.4,ijs:.7,ilu:3.4,iluaaf:2.7,ily:3.4,ily2:2.6,iou:.7,iyq:2.3,"j/j":2,"j/k":1.6,"j/p":1.4,"j/t":-.2,"j/w":1,j4f:1.4,j4g:1.7,jho:.8,jhomf:1,jj:1,jk:.9,jp:.8,jt:.9,jw:1.6,jealz:-1.2,k4y:2.3,kfy:2.3,kia:-3.2,kk:1.5,kmuf:2.2,l:2,"l&r":2.2,laoj:1.3,lmbao:1.8,lmfao:2.5,lmso:2.7,lolz:2.7,lts:1.6,ly:2.6,ly4e:2.7,lya:3.3,lyb:3,lyl:3.1,lylab:2.7,lylas:2.6,lylb:1.6,m8:1.4,mia:-1.2,mml:2,mofo:-2.4,mubar:-1,musm:.9,mwah:2.5,n1:1.9,nbd:1.3,nbif:-.5,nfc:-2.7,nfw:-2.4,nh:2.2,nimby:-.8,nimjd:-.7,nimq:-.2,nimy:-1.4,nitl:-1.5,nme:-2.1,noyb:-.7,np:1.4,ntmu:1.4,"o-8":-.5,"o-:":-.3,"o-|":-1.1,"O.o":-.6,"o.O":-.6,"o:":-.2,"o:)":1.5,"o:-)":2,"o:-3":2.2,"o:3":2.3,"o:<":-.3,"o;^)":1.6,o_o:-.5,O_o:-.5,o_O:-.5,pita:-2.4,pls:.3,plz:.3,pmbi:.8,pmfji:.3,pmji:.7,po:-2.6,ptl:2.6,pu:-1.1,qq:-2.2,qt:1.8,"r&r":2.4,rofl:2.7,roflmao:2.5,rotfl:2.6,rotflmao:2.8,rotflmfao:2.5,rotflol:3,rotgl:2.9,rotglmao:1.8,"s:":-1.1,sapfu:-1.1,sete:2.8,sfete:2.7,sgtm:2.4,slap:.6,slaw:2.1,smh:-1.3,snafu:-2.5,swak:2.3,tgif:2.3,thks:1.4,thx:1.5,tia:2.3,tmi:-.3,tnx:1.1,true:1.8,tx:1.5,txs:1.1,ty:1.6,tyvm:2.5,urw:1.9,vbg:2.1,vbs:3.1,vip:2.3,vwd:2.6,vwp:2.1,wag:-.2,wd:2.7,wilco:.9,wp:1,wtf:-2.8,wtg:2.1,wth:-2.4,xlnt:3,xoxo:3,xoxozzz:2.3,xqzt:1.6,xtc:.8,yolo:1.1,yoyo:.4,yvw:1.6,yw:1.8,ywia:2.5,zzz:-1.2,"[-;":.5,"[:":1.3,"[;":1,"[=":1.7,"\\-:":-1,"\\:":-1,"\\:<":-1.7,"\\=":-1.1,"\\^:":-1.3,"\\o/":2.2,"\\o:":-1.2,"]-:":-2.1,"]:":-1.6,"]:<":-2.5,"^<_<":1.4,"^urs":-2.8,abandon:-1.9,abandoned:-2,abandoner:-1.9,abandoners:-1.9,abandoning:-1.6,abandonment:-2.4,abandonments:-1.7,abandons:-1.3,abducted:-2.3,abduction:-2.8,abductions:-2,abhor:-2,abhorred:-2.4,abhorrent:-3.1,abhors:-2.9,abilities:1,ability:1.3,aboard:.1,absentee:-1.1,absentees:-.8,absolve:1.2,absolved:1.5,absolves:1.3,absolving:1.6,abuse:-3.2,abused:-2.3,abuser:-2.6,abusers:-2.6,abuses:-2.6,abusing:-2,abusive:-3.2,abusively:-2.8,abusiveness:-2.5,abusivenesses:-3,accept:1.6,acceptabilities:1.6,acceptability:1.1,acceptable:1.3,acceptableness:1.3,acceptably:1.5,acceptance:2,acceptances:1.7,acceptant:1.6,acceptation:1.3,acceptations:.9,accepted:1.1,accepting:1.6,accepts:1.3,accident:-2.1,accidental:-.3,accidentally:-1.4,accidents:-1.3,accomplish:1.8,accomplished:1.9,accomplishes:1.7,accusation:-1,accusations:-1.3,accuse:-.8,accused:-1.2,accuses:-1.4,accusing:-.7,ache:-1.6,ached:-1.6,aches:-1,achievable:1.3,aching:-2.2,acquit:.8,acquits:.1,acquitted:1,acquitting:1.3,acrimonious:-1.7,active:1.7,actively:1.3,activeness:.6,activenesses:.8,actives:1.1,adequate:.9,admirability:2.4,admirable:2.6,admirableness:2.2,admirably:2.5,admiral:1.3,admirals:1.5,admiralties:1.6,admiralty:1.2,admiration:2.5,admirations:1.6,admire:2.1,admired:2.3,admirer:1.8,admirers:1.7,admires:1.5,admiring:1.6,admiringly:2.3,admit:.8,admits:1.2,admitted:.4,admonished:-1.9,adopt:.7,adopts:.7,adorability:2.2,adorable:2.2,adorableness:2.5,adorably:2.1,adoration:2.9,adorations:2.2,adore:2.6,adored:1.8,adorer:1.7,adorers:2.1,adores:1.6,adoring:2.6,adoringly:2.4,adorn:.9,adorned:.8,adorner:1.3,adorners:.9,adorning:1,adornment:1.3,adornments:.8,adorns:.5,advanced:1,advantage:1,advantaged:1.4,advantageous:1.5,advantageously:1.9,advantageousness:1.6,advantages:1.5,advantaging:1.6,adventure:1.3,adventured:1.3,adventurer:1.2,adventurers:.9,adventures:1.4,adventuresome:1.7,adventuresomeness:1.3,adventuress:.8,adventuresses:1.4,adventuring:2.3,adventurism:1.5,adventurist:1.4,adventuristic:1.7,adventurists:1.2,adventurous:1.4,adventurously:1.3,adventurousness:1.8,adversarial:-1.5,adversaries:-1,adversary:-.8,adversative:-1.2,adversatively:-.1,adversatives:-1,adverse:-1.5,adversely:-.8,adverseness:-.6,adversities:-1.5,adversity:-1.8,affected:-.6,affection:2.4,affectional:1.9,affectionally:1.5,affectionate:1.9,affectionately:2.2,affectioned:1.8,affectionless:-2,affections:1.5,afflicted:-1.5,affronted:.2,aggravate:-2.5,aggravated:-1.9,aggravates:-1.9,aggravating:-1.2,aggress:-1.3,aggressed:-1.4,aggresses:-.5,aggressing:-.6,aggression:-1.2,aggressions:-1.3,aggressive:-.6,aggressively:-1.3,aggressiveness:-1.8,aggressivities:-1.4,aggressivity:-.6,aggressor:-.8,aggressors:-.9,aghast:-1.9,agitate:-1.7,agitated:-2,agitatedly:-1.6,agitates:-1.4,agitating:-1.8,agitation:-1,agitational:-1.2,agitations:-1.3,agitative:-1.3,agitato:-.1,agitator:-1.4,agitators:-2.1,agog:1.9,agonise:-2.1,agonised:-2.3,agonises:-2.4,agonising:-1.5,agonize:-2.3,agonized:-2.2,agonizes:-2.3,agonizing:-2.7,agonizingly:-2.3,agony:-1.8,agree:1.5,agreeability:1.9,agreeable:1.8,agreeableness:1.8,agreeablenesses:1.3,agreeably:1.6,agreed:1.1,agreeing:1.4,agreement:2.2,agreements:1.1,agrees:.8,alarm:-1.4,alarmed:-1.4,alarming:-.5,alarmingly:-2.6,alarmism:-.3,alarmists:-1.1,alarms:-1.1,alas:-1.1,alert:1.2,alienation:-1.1,alive:1.6,allergic:-1.2,allow:.9,alone:-1,alright:1,amaze:2.5,amazed:2.2,amazedly:2.1,amazement:2.5,amazements:2.2,amazes:2.2,amazing:2.8,amazon:.7,amazonite:.2,amazons:-.1,amazonstone:1,amazonstones:.2,ambitious:2.1,ambivalent:.5,amor:3,amoral:-1.6,amoralism:-.7,amoralisms:-.7,amoralities:-1.2,amorality:-1.5,amorally:-1,amoretti:.2,amoretto:.6,amorettos:.3,amorino:1.2,amorist:1.6,amoristic:1,amorists:.1,amoroso:2.3,amorous:1.8,amorously:2.3,amorousness:2,amorphous:-.2,amorphously:.1,amorphousness:.3,amort:-2.1,amortise:.5,amortised:-.2,amortises:.1,amortizable:.5,amortization:.6,amortizations:.2,amortize:-.1,amortized:.8,amortizes:.6,amortizing:.8,amusable:.7,amuse:1.7,amused:1.8,amusedly:2.2,amusement:1.5,amusements:1.5,amuser:1.1,amusers:1.3,amuses:1.7,amusia:.3,amusias:-.4,amusing:1.6,amusingly:.8,amusingness:1.8,amusive:1.7,anger:-2.7,angered:-2.3,angering:-2.2,angerly:-1.9,angers:-2.3,angrier:-2.3,angriest:-3.1,angrily:-1.8,angriness:-1.7,angry:-2.3,anguish:-2.9,anguished:-1.8,anguishes:-2.1,anguishing:-2.7,animosity:-1.9,annoy:-1.9,annoyance:-1.3,annoyances:-1.8,annoyed:-1.6,annoyer:-2.2,annoyers:-1.5,annoying:-1.7,annoys:-1.8,antagonism:-1.9,antagonisms:-1.2,antagonist:-1.9,antagonistic:-1.7,antagonistically:-2.2,antagonists:-1.7,antagonize:-2,antagonized:-1.4,antagonizes:-.5,antagonizing:-2.7,anti:-1.3,anticipation:.4,anxieties:-.6,anxiety:-.7,anxious:-1,anxiously:-.9,anxiousness:-1,aok:2,apathetic:-1.2,apathetically:-.4,apathies:-.6,apathy:-1.2,apeshit:-.9,apocalyptic:-3.4,apologise:1.6,apologised:.4,apologises:.8,apologising:.2,apologize:.4,apologized:1.3,apologizes:1.5,apologizing:-.3,apology:.2,appall:-2.4,appalled:-2,appalling:-1.5,appallingly:-2,appalls:-1.9,appease:1.1,appeased:.9,appeases:.9,appeasing:1,applaud:2,applauded:1.5,applauding:2.1,applauds:1.4,applause:1.8,appreciate:1.7,appreciated:2.3,appreciates:2.3,appreciating:1.9,appreciation:2.3,appreciations:1.7,appreciative:2.6,appreciatively:1.8,appreciativeness:1.6,appreciator:2.6,appreciators:1.5,appreciatory:1.7,apprehensible:1.1,apprehensibly:-.2,apprehension:-2.1,apprehensions:-.9,apprehensively:-.3,apprehensiveness:-.7,approval:2.1,approved:1.8,approves:1.7,ardent:2.1,arguable:-1,arguably:-1,argue:-1.4,argued:-1.5,arguer:-1.6,arguers:-1.4,argues:-1.6,arguing:-2,argument:-1.5,argumentative:-1.5,argumentatively:-1.8,argumentive:-1.5,arguments:-1.7,arrest:-1.4,arrested:-2.1,arrests:-1.9,arrogance:-2.4,arrogances:-1.9,arrogant:-2.2,arrogantly:-1.8,ashamed:-2.1,ashamedly:-1.7,ass:-2.5,assassination:-2.9,assassinations:-2.7,assault:-2.8,assaulted:-2.4,assaulting:-2.3,assaultive:-2.8,assaults:-2.5,asset:1.5,assets:.7,assfucking:-2.5,assholes:-2.8,assurance:1.4,assurances:1.4,assure:1.4,assured:1.5,assuredly:1.6,assuredness:1.4,assurer:.9,assurers:1.1,assures:1.3,assurgent:1.3,assuring:1.6,assuror:.5,assurors:.7,astonished:1.6,astound:1.7,astounded:1.8,astounding:1.8,astoundingly:2.1,astounds:2.1,attachment:1.2,attachments:1.1,attack:-2.1,attacked:-2,attacker:-2.7,attackers:-2.7,attacking:-2,attacks:-1.9,attract:1.5,attractancy:.9,attractant:1.3,attractants:1.4,attracted:1.8,attracting:2.1,attraction:2,attractions:1.8,attractive:1.9,attractively:2.2,attractiveness:1.8,attractivenesses:2.1,attractor:1.2,attractors:1.2,attracts:1.7,audacious:.9,authority:.3,aversion:-1.9,aversions:-1.1,aversive:-1.6,aversively:-.8,avert:-.7,averted:-.3,averts:-.4,avid:1.2,avoid:-1.2,avoidance:-1.7,avoidances:-1.1,avoided:-1.4,avoider:-1.8,avoiders:-1.4,avoiding:-1.4,avoids:-.7,await:.4,awaited:-.1,awaits:.3,award:2.5,awardable:2.4,awarded:1.7,awardee:1.8,awardees:1.2,awarder:.9,awarders:1.3,awarding:1.9,awards:2,awesome:3.1,awful:-2,awkward:-.6,awkwardly:-1.3,awkwardness:-.7,axe:-.4,axed:-1.3,backed:.1,backing:.1,backs:-.2,bad:-2.5,badass:-.6,badly:-2.1,bailout:-.4,bamboozle:-1.5,bamboozled:-1.5,bamboozles:-1.5,ban:-2.6,banish:-1.9,bankrupt:-2.6,bankster:-2.1,banned:-2,bargain:.8,barrier:-.5,bashful:-.1,bashfully:.2,bashfulness:-.8,bastard:-2.5,bastardies:-1.8,bastardise:-2.1,bastardised:-2.3,bastardises:-2.3,bastardising:-2.6,bastardization:-2.4,bastardizations:-2.1,bastardize:-2.4,bastardized:-2,bastardizes:-1.8,bastardizing:-2.3,bastardly:-2.7,bastards:-3,bastardy:-2.7,battle:-1.6,battled:-1.2,battlefield:-1.6,battlefields:-.9,battlefront:-1.2,battlefronts:-.8,battleground:-1.7,battlegrounds:-.6,battlement:-.4,battlements:-.4,battler:-.8,battlers:-.2,battles:-1.6,battleship:-.1,battleships:-.5,battlewagon:-.3,battlewagons:-.5,battling:-1.1,beaten:-1.8,beatific:1.8,beating:-2,beaut:1.6,beauteous:2.5,beauteously:2.6,beauteousness:2.7,beautician:1.2,beauticians:.4,beauties:2.4,beautification:1.9,beautifications:2.4,beautified:2.1,beautifier:1.7,beautifiers:1.7,beautifies:1.8,beautiful:2.9,beautifuler:2.1,beautifulest:2.6,beautifully:2.7,beautifulness:2.6,beautify:2.3,beautifying:2.3,beauts:1.7,beauty:2.8,belittle:-1.9,belittled:-2,beloved:2.3,benefic:1.4,benefice:.4,beneficed:1.1,beneficence:2.8,beneficences:1.5,beneficent:2.3,beneficently:2.2,benefices:1.1,beneficial:1.9,beneficially:2.4,beneficialness:1.7,beneficiaries:1.8,beneficiary:2.1,beneficiate:1,beneficiation:.4,benefit:2,benefits:1.6,benefitted:1.7,benefitting:1.9,benevolence:1.7,benevolences:1.9,benevolent:2.7,benevolently:1.4,benevolentness:1.2,benign:1.3,benignancy:.6,benignant:2.2,benignantly:1.1,benignities:.9,benignity:1.3,benignly:.2,bereave:-2.1,bereaved:-2.1,bereaves:-1.9,bereaving:-1.3,best:3.2,betray:-3.2,betrayal:-2.8,betrayed:-3,betraying:-2.5,betrays:-2.5,better:1.9,bias:-.4,biased:-1.1,bitch:-2.8,bitched:-2.6,bitcheries:-2.3,bitchery:-2.7,bitches:-2.9,bitchier:-2,bitchiest:-3,bitchily:-2.6,bitchiness:-2.6,bitching:-1.1,bitchy:-2.3,bitter:-1.8,bitterbrush:-.2,bitterbrushes:-.6,bittered:-1.8,bitterer:-1.9,bitterest:-2.3,bittering:-1.2,bitterish:-1.6,bitterly:-2,bittern:-.2,bitterness:-1.7,bitterns:-.4,bitterroots:-.2,bitters:-.4,bittersweet:-.3,bittersweetness:-.6,bittersweets:-.2,bitterweeds:-.5,bizarre:-1.3,blah:-.4,blam:-.2,blamable:-1.8,blamably:-1.8,blame:-1.4,blamed:-2.1,blameful:-1.7,blamefully:-1.6,blameless:.7,blamelessly:.9,blamelessness:.6,blamer:-2.1,blamers:-2,blames:-1.7,blameworthiness:-1.6,blameworthy:-2.3,blaming:-2.2,bless:1.8,blessed:2.9,blesseder:2,blessedest:2.8,blessedly:1.7,blessedness:1.6,blesser:2.6,blessers:1.9,blesses:2.6,blessing:2.2,blessings:2.5,blind:-1.7,bliss:2.7,blissful:2.9,blithe:1.2,block:-1.9,blockbuster:2.9,blocked:-1.1,blocking:-1.6,blocks:-.9,bloody:-1.9,blurry:-.4,bold:1.6,bolder:1.2,boldest:1.6,boldface:.3,boldfaced:-.1,boldfaces:.1,boldfacing:.1,boldly:1.5,boldness:1.5,boldnesses:.9,bolds:1.3,bomb:-2.2,bonus:2.5,bonuses:2.6,boost:1.7,boosted:1.5,boosting:1.4,boosts:1.3,bore:-1,boreal:-.3,borecole:-.2,borecoles:-.3,bored:-1.1,boredom:-1.3,boredoms:-1.1,boreen:.1,boreens:.2,boreholes:-.2,borer:-.4,borers:-1.2,bores:-1.3,borescopes:-.1,boresome:-1.3,boring:-1.3,bother:-1.4,botheration:-1.7,botherations:-1.3,bothered:-1.3,bothering:-1.6,bothers:-.8,bothersome:-1.3,boycott:-1.3,boycotted:-1.7,boycotting:-1.7,boycotts:-1.4,brainwashing:-1.5,brave:2.4,braved:1.9,bravely:2.3,braver:2.4,braveries:2,bravery:2.2,braves:1.9,bravest:2.3,breathtaking:2,bribe:-.8,bright:1.9,brighten:1.9,brightened:2.1,brightener:1,brighteners:1,brightening:2.5,brightens:1.5,brighter:1.6,brightest:3,brightly:1.5,brightness:1.6,brightnesses:1.4,brights:.4,brightwork:1.1,brilliance:2.9,brilliances:2.9,brilliancies:2.3,brilliancy:2.6,brilliant:2.8,brilliantine:.8,brilliantines:2,brilliantly:3,brilliants:1.9,brisk:.6,broke:-1.8,broken:-2.1,brooding:.1,brutal:-3.1,brutalise:-2.7,brutalised:-2.9,brutalises:-3.2,brutalising:-2.8,brutalities:-2.6,brutality:-3,brutalization:-2.1,brutalizations:-2.3,brutalize:-2.9,brutalized:-2.4,brutalizes:-3.2,brutalizing:-3.4,brutally:-3,bullied:-3.1,bullshit:-2.8,bully:-2.2,bullying:-2.9,bummer:-1.6,buoyant:.9,burden:-1.9,burdened:-1.7,burdener:-1.3,burdeners:-1.7,burdening:-1.4,burdens:-1.5,burdensome:-1.8,bwahaha:.4,bwahahah:2.5,calm:1.3,calmative:1.1,calmatives:.5,calmed:1.6,calmer:1.5,calmest:1.6,calming:1.7,calmly:1.3,calmness:1.7,calmnesses:1.6,calmodulin:.2,calms:1.3,"can't stand":-2,cancel:-1,cancelled:-1,cancelling:-.8,cancels:-.9,cancer:-3.4,capable:1.6,captivated:1.6,care:2.2,cared:1.8,carefree:1.7,careful:.6,carefully:.5,carefulness:2,careless:-1.5,carelessly:-1,carelessness:-1.4,carelessnesses:-1.6,cares:2,caring:2.2,casual:.8,casually:.7,casualty:-2.4,catastrophe:-3.4,catastrophic:-2.2,cautious:-.4,celebrate:2.7,celebrated:2.7,celebrates:2.7,celebrating:2.7,censor:-2,censored:-.6,censors:-1.2,certain:1.1,certainly:1.4,certainties:.9,certainty:1,chagrin:-1.9,chagrined:-1.4,challenge:.3,challenged:-.4,challenger:.5,challengers:.4,challenges:.3,challenging:.6,challengingly:-.6,champ:2.1,champac:-.2,champagne:1.2,champagnes:.5,champaign:.2,champaigns:.5,champaks:-.2,champed:1,champer:-.1,champers:.5,champerties:-.1,champertous:.3,champerty:-.2,champignon:.4,champignons:.2,champing:.7,champion:2.9,championed:1.2,championing:1.8,champions:2.4,championship:1.9,championships:2.2,champs:1.8,champy:1,chance:1,chances:.8,chaos:-2.7,chaotic:-2.2,charged:-.8,charges:-1.1,charitable:1.7,charitableness:1.9,charitablenesses:1.6,charitably:1.4,charities:2.2,charity:1.8,charm:1.7,charmed:2,charmer:1.9,charmers:2.1,charmeuse:.3,charmeuses:.4,charming:2.8,charminger:1.5,charmingest:2.4,charmingly:2.2,charmless:-1.8,charms:1.9,chastise:-2.5,chastised:-2.2,chastises:-1.7,chastising:-1.7,cheat:-2,cheated:-2.3,cheater:-2.5,cheaters:-1.9,cheating:-2.6,cheats:-1.8,cheer:2.3,cheered:2.3,cheerer:1.7,cheerers:1.8,cheerful:2.5,cheerfuller:1.9,cheerfullest:3.2,cheerfully:2.1,cheerfulness:2.1,cheerier:2.6,cheeriest:2.2,cheerily:2.5,cheeriness:2.5,cheering:2.3,cheerio:1.2,cheerlead:1.7,cheerleader:.9,cheerleaders:1.2,cheerleading:1.2,cheerleads:1.2,cheerled:1.5,cheerless:-1.7,cheerlessly:-.8,cheerlessness:-1.7,cheerly:2.4,cheers:2.1,cheery:2.6,cherish:1.6,cherishable:2,cherished:2.3,cherisher:2.2,cherishers:1.9,cherishes:2.2,cherishing:2,chic:1.1,childish:-1.2,chilling:-.1,choke:-2.5,choked:-2.1,chokes:-2,choking:-2,chuckle:1.7,chuckled:1.2,chucklehead:-1.9,chuckleheaded:-1.3,chuckleheads:-1.1,chuckler:.8,chucklers:1.2,chuckles:1.1,chucklesome:1.1,chuckling:1.4,chucklingly:1.2,clarifies:.9,clarity:1.7,classy:1.9,clean:1.7,cleaner:.7,clear:1.6,cleared:.4,clearly:1.7,clears:.3,clever:2,cleverer:2,cleverest:2.6,cleverish:1,cleverly:2.3,cleverness:2.3,clevernesses:1.4,clouded:-.2,clueless:-1.5,cock:-.6,cocksucker:-3.1,cocksuckers:-2.6,cocky:-.5,coerced:-1.5,collapse:-2.2,collapsed:-1.1,collapses:-1.2,collapsing:-1.2,collide:-.3,collides:-1.1,colliding:-.5,collision:-1.5,collisions:-1.1,colluding:-1.2,combat:-1.4,combats:-.8,comedian:1.6,comedians:1.2,comedic:1.7,comedically:2.1,comedienne:.6,comediennes:1.6,comedies:1.7,comedo:.3,comedones:-.8,comedown:-.8,comedowns:-.9,comedy:1.5,comfort:1.5,comfortable:2.3,comfortableness:1.3,comfortably:1.8,comforted:1.8,comforter:1.9,comforters:1.2,comforting:1.7,comfortingly:1.7,comfortless:-1.8,comforts:2.1,commend:1.9,commended:1.9,commit:1.2,commitment:1.6,commitments:.5,commits:.1,committed:1.1,committing:.3,compassion:2,compassionate:2.2,compassionated:1.6,compassionately:1.7,compassionateness:.9,compassionates:1.6,compassionating:1.6,compassionless:-2.6,compelled:.2,compelling:.9,competent:1.3,competitive:.7,complacent:-.3,complain:-1.5,complainant:-.7,complainants:-1.1,complained:-1.7,complainer:-1.8,complainers:-1.3,complaining:-.8,complainingly:-1.7,complains:-1.6,complaint:-1.2,complaints:-1.7,compliment:2.1,complimentarily:1.7,complimentary:1.9,complimented:1.8,complimenting:2.3,compliments:1.7,comprehensive:1,conciliate:1,conciliated:1.1,conciliates:1.1,conciliating:1.3,condemn:-1.6,condemnation:-2.8,condemned:-1.9,condemns:-2.3,confidence:2.3,confident:2.2,confidently:2.1,conflict:-1.3,conflicting:-1.7,conflictive:-1.8,conflicts:-1.6,confront:-.7,confrontation:-1.3,confrontational:-1.6,confrontationist:-1,confrontationists:-1.2,confrontations:-1.5,confronted:-.8,confronter:-.3,confronters:-1.3,confronting:-.6,confronts:-.9,confuse:-.9,confused:-1.3,confusedly:-.6,confusedness:-1.5,confuses:-1.3,confusing:-.9,confusingly:-1.4,confusion:-1.2,confusional:-1.2,confusions:-.9,congrats:2.4,congratulate:2.2,congratulation:2.9,congratulations:2.9,consent:.9,consents:1,considerate:1.9,consolable:1.1,conspiracy:-2.4,constrained:-.4,contagion:-2,contagions:-1.5,contagious:-1.4,contempt:-2.8,contemptibilities:-2,contemptibility:-.9,contemptible:-1.6,contemptibleness:-1.9,contemptibly:-1.4,contempts:-1,contemptuous:-2.2,contemptuously:-2.4,contemptuousness:-1.1,contend:.2,contender:.5,contented:1.4,contentedly:1.9,contentedness:1.4,contentious:-1.2,contentment:1.5,contestable:.6,contradict:-1.3,contradictable:-1,contradicted:-1.3,contradicting:-1.3,contradiction:-1,contradictions:-1.3,contradictious:-1.9,contradictor:-1,contradictories:-.5,contradictorily:-.9,contradictoriness:-1.4,contradictors:-1.6,contradictory:-1.4,contradicts:-1.4,controversial:-.8,controversially:-1.1,convince:1,convinced:1.7,convincer:.6,convincers:.3,convinces:.7,convincing:1.7,convincingly:1.6,convincingness:.7,convivial:1.2,cool:1.3,cornered:-1.1,corpse:-2.7,costly:-.4,courage:2.2,courageous:2.4,courageously:2.3,courageousness:2.1,courteous:2.3,courtesy:1.5,"cover-up":-1.2,coward:-2,cowardly:-1.6,coziness:1.5,cramp:-.8,crap:-1.6,crappy:-2.6,crash:-1.7,craze:-.6,crazed:-.5,crazes:.2,crazier:-.1,craziest:-.2,crazily:-1.5,craziness:-1.6,crazinesses:-1,crazing:-.5,crazy:-1.4,crazyweed:.8,create:1.1,created:1,creates:1.1,creatin:.1,creatine:.2,creating:1.2,creatinine:.4,creation:1.1,creationism:.7,creationisms:1.1,creationist:.8,creationists:.5,creations:1.6,creative:1.9,creatively:1.5,creativeness:1.8,creativities:1.7,creativity:1.6,credit:1.6,creditabilities:1.4,creditability:1.9,creditable:1.8,creditableness:1.2,creditably:1.7,credited:1.5,crediting:.6,creditor:-.1,credits:1.5,creditworthiness:1.9,creditworthy:2.4,crestfallen:-2.5,cried:-1.6,cries:-1.7,crime:-2.5,criminal:-2.4,criminals:-2.7,crisis:-3.1,critic:-1.1,critical:-1.3,criticise:-1.9,criticised:-1.8,criticises:-1.3,criticising:-1.7,criticism:-1.9,criticisms:-.9,criticizable:-1,criticize:-1.6,criticized:-1.5,criticizer:-1.5,criticizers:-1.6,criticizes:-1.4,criticizing:-1.5,critics:-1.2,crude:-2.7,crudely:-1.2,crudeness:-2,crudenesses:-2,cruder:-2,crudes:-1.1,crudest:-2.4,cruel:-2.8,crueler:-2.3,cruelest:-2.6,crueller:-2.4,cruellest:-2.9,cruelly:-2.8,cruelness:-2.9,cruelties:-2.3,cruelty:-2.9,crush:-.6,crushed:-1.8,crushes:-1.9,crushing:-1.5,cry:-2.1,crying:-2.1,cunt:-2.2,cunts:-2.9,curious:1.3,curse:-2.5,cut:-1.1,cute:2,cutely:1.3,cuteness:2.3,cutenesses:1.9,cuter:2.3,cutes:1.8,cutesie:1,cutesier:1.5,cutesiest:2.2,cutest:2.8,cutesy:2.1,cutey:2.1,cuteys:1.5,cutie:1.5,cutiepie:2,cuties:2.2,cuts:-1.2,cutting:-.5,cynic:-1.4,cynical:-1.6,cynically:-1.3,cynicism:-1.7,cynicisms:-1.7,cynics:-.3,"d-:":1.6,"d:":1.2,"d=":1.5,damage:-2.2,damaged:-1.9,damager:-1.9,damagers:-2,damages:-1.9,damaging:-2.3,damagingly:-2,damn:-1.7,damnable:-1.7,damnableness:-1.8,damnably:-1.7,damnation:-2.6,damnations:-1.4,damnatory:-2.6,damned:-1.6,damnedest:-.5,damnified:-2.8,damnifies:-1.8,damnify:-2.2,damnifying:-2.4,damning:-1.4,damningly:-2,damnit:-2.4,damns:-2.2,danger:-2.4,dangered:-2.4,dangering:-2.5,dangerous:-2.1,dangerously:-2,dangerousness:-2,dangers:-2.2,daredevil:.5,daring:1.5,daringly:2.1,daringness:1.4,darings:.4,darkest:-2.2,darkness:-1,darling:2.8,darlingly:1.6,darlingness:2.3,darlings:2.2,dauntless:2.3,daze:-.7,dazed:-.7,dazedly:-.4,dazedness:-.5,dazes:-.3,dead:-3.3,deadlock:-1.4,deafening:-1.2,dear:1.6,dearer:1.9,dearest:2.6,dearie:2.2,dearies:1,dearly:1.8,dearness:2,dears:1.9,dearth:-2.3,dearths:-.9,deary:1.9,death:-2.9,debonair:.8,debt:-1.5,decay:-1.7,decayed:-1.6,decayer:-1.6,decayers:-1.6,decaying:-1.7,decays:-1.7,deceit:-2,deceitful:-1.9,deceive:-1.7,deceived:-1.9,deceives:-1.6,deceiving:-1.4,deception:-1.9,decisive:.9,dedicated:2,defeat:-2,defeated:-2.1,defeater:-1.4,defeaters:-.9,defeating:-1.6,defeatism:-1.3,defeatist:-1.7,defeatists:-2.1,defeats:-1.3,defeature:-1.9,defeatures:-1.5,defect:-1.4,defected:-1.7,defecting:-1.8,defection:-1.4,defections:-1.5,defective:-1.9,defectively:-2.1,defectiveness:-1.8,defectives:-1.8,defector:-1.9,defectors:-1.3,defects:-1.7,defence:.4,defenceman:.4,defencemen:.6,defences:-.2,defender:.4,defenders:.3,defense:.5,defenseless:-1.4,defenselessly:-1.1,defenselessness:-1.3,defenseman:.1,defensemen:-.4,defenses:.7,defensibility:.4,defensible:.8,defensibly:.1,defensive:.1,defensively:-.6,defensiveness:-.4,defensives:-.3,defer:-1.2,deferring:-.7,defiant:-.9,deficit:-1.7,definite:1.1,definitely:1.7,degradable:-1,degradation:-2.4,degradations:-1.5,degradative:-2,degrade:-1.9,degraded:-1.8,degrader:-2,degraders:-2,degrades:-2.1,degrading:-2.8,degradingly:-2.7,dehumanize:-1.8,dehumanized:-1.9,dehumanizes:-1.5,dehumanizing:-2.4,deject:-2.2,dejected:-2.2,dejecting:-2.3,dejects:-2,delay:-1.3,delayed:-.9,delectable:2.9,delectables:1.4,delectably:2.8,delicate:.2,delicately:1,delicates:.6,delicatessen:.4,delicatessens:.4,delicious:2.7,deliciously:1.9,deliciousness:1.8,delight:2.9,delighted:2.3,delightedly:2.4,delightedness:2.1,delighter:2,delighters:2.6,delightful:2.8,delightfully:2.7,delightfulness:2.1,delighting:1.6,delights:2,delightsome:2.3,demand:-.5,demanded:-.9,demanding:-.9,demonstration:.4,demoralized:-1.6,denied:-1.9,denier:-1.5,deniers:-1.1,denies:-1.8,denounce:-1.4,denounces:-1.9,deny:-1.4,denying:-1.4,depress:-2.2,depressant:-1.6,depressants:-1.6,depressed:-2.3,depresses:-2.2,depressible:-1.7,depressing:-1.6,depressingly:-2.3,depression:-2.7,depressions:-2.2,depressive:-1.6,depressively:-2.1,depressives:-1.5,depressor:-1.8,depressors:-1.7,depressurization:-.3,depressurizations:-.4,depressurize:-.5,depressurized:-.3,depressurizes:-.3,depressurizing:-.7,deprival:-2.1,deprivals:-1.2,deprivation:-1.8,deprivations:-1.8,deprive:-2.1,deprived:-2.1,depriver:-1.6,deprivers:-1.4,deprives:-1.7,depriving:-2,derail:-1.2,derailed:-1.4,derails:-1.3,deride:-1.1,derided:-.8,derides:-1,deriding:-1.5,derision:-1.2,desirable:1.3,desire:1.7,desired:1.1,desirous:1.3,despair:-1.3,despaired:-2.7,despairer:-1.3,despairers:-1.3,despairing:-2.3,despairingly:-2.2,despairs:-2.7,desperate:-1.3,desperately:-1.6,desperateness:-1.5,desperation:-2,desperations:-2.2,despise:-1.4,despised:-1.7,despisement:-2.4,despisements:-2.5,despiser:-1.8,despisers:-1.6,despises:-2,despising:-2.7,despondent:-2.1,destroy:-2.5,destroyed:-2.2,destroyer:-2,destroyers:-2.3,destroying:-2.6,destroys:-2.6,destruct:-2.4,destructed:-1.9,destructibility:-1.8,destructible:-1.5,destructing:-2.5,destruction:-2.7,destructionist:-2.6,destructionists:-2.1,destructions:-2.3,destructive:-3,destructively:-2.4,destructiveness:-2.4,destructivity:-2.2,destructs:-2.4,detached:-.5,detain:-1.8,detained:-1.7,detention:-1.5,determinable:.9,determinableness:.2,determinably:.9,determinacy:1,determinant:.2,determinantal:-.3,determinate:.8,determinately:1.2,determinateness:1.1,determination:1.7,determinations:.8,determinative:1.1,determinatives:.9,determinator:1.1,determined:1.4,devastate:-3.1,devastated:-3,devastates:-2.8,devastating:-3.3,devastatingly:-2.4,devastation:-1.8,devastations:-1.9,devastative:-3.2,devastator:-2.8,devastators:-2.9,devil:-3.4,deviled:-1.6,devilfish:-.8,devilfishes:-.6,deviling:-2.2,devilish:-2.1,devilishly:-1.6,devilishness:-2.3,devilkin:-2.4,devilled:-2.3,devilling:-1.8,devilment:-1.9,devilments:-1.1,devilries:-1.6,devilry:-2.8,devils:-2.7,deviltries:-1.5,deviltry:-2.8,devilwood:-.8,devilwoods:-1,devote:1.4,devoted:1.7,devotedly:1.6,devotedness:2,devotee:1.6,devotees:.5,devotement:1.5,devotements:1.1,devotes:1.6,devoting:2.1,devotion:2,devotional:1.2,devotionally:2.2,devotionals:1.2,devotions:1.8,diamond:1.4,dick:-2.3,dickhead:-3.1,die:-2.9,died:-2.6,difficult:-1.5,difficulties:-1.2,difficultly:-1.7,difficulty:-1.4,diffident:-1,dignified:2.2,dignifies:2,dignify:1.8,dignifying:2.1,dignitaries:.6,dignitary:1.9,dignities:1.4,dignity:1.7,dilemma:-.7,dipshit:-2.1,dire:-2,direful:-3.1,dirt:-1.4,dirtier:-1.4,dirtiest:-2.4,dirty:-1.9,disabling:-2.1,disadvantage:-1.8,disadvantaged:-1.7,disadvantageous:-1.8,disadvantageously:-2.1,disadvantageousness:-1.6,disadvantages:-1.7,disagree:-1.6,disagreeable:-1.7,disagreeableness:-1.7,disagreeablenesses:-1.9,disagreeably:-1.5,disagreed:-1.3,disagreeing:-1.4,disagreement:-1.5,disagreements:-1.8,disagrees:-1.3,disappear:-.9,disappeared:-.9,disappears:-1.4,disappoint:-1.7,disappointed:-2.1,disappointedly:-1.7,disappointing:-2.2,disappointingly:-1.9,disappointment:-2.3,disappointments:-2,disappoints:-1.6,disaster:-3.1,disasters:-2.6,disastrous:-2.9,disbelieve:-1.2,discard:-1,discarded:-1.4,discarding:-.7,discards:-1,discomfort:-1.8,discomfortable:-1.6,discomforted:-1.6,discomforting:-1.6,discomforts:-1.3,disconsolate:-2.3,disconsolation:-1.7,discontented:-1.8,discord:-1.7,discounted:.2,discourage:-1.8,discourageable:-1.2,discouraged:-1.7,discouragement:-2,discouragements:-1.8,discourager:-1.7,discouragers:-1.9,discourages:-1.9,discouraging:-1.9,discouragingly:-1.8,discredited:-1.9,disdain:-2.1,disgrace:-2.2,disgraced:-2,disguise:-1,disguised:-1.1,disguises:-1,disguising:-1.3,disgust:-2.9,disgusted:-2.4,disgustedly:-3,disgustful:-2.6,disgusting:-2.4,disgustingly:-2.9,disgusts:-2.1,dishearten:-2,disheartened:-2.2,disheartening:-1.8,dishearteningly:-2,disheartenment:-2.3,disheartenments:-2.2,disheartens:-2.2,dishonest:-2.7,disillusion:-1,disillusioned:-1.9,disillusioning:-1.3,disillusionment:-1.7,disillusionments:-1.5,disillusions:-1.6,disinclined:-1.1,disjointed:-1.3,dislike:-1.6,disliked:-1.7,dislikes:-1.7,disliking:-1.3,dismal:-3,dismay:-1.8,dismayed:-1.9,dismaying:-2.2,dismayingly:-1.9,dismays:-1.8,disorder:-1.7,disorganized:-1.2,disoriented:-1.5,disparage:-2,disparaged:-1.4,disparages:-1.6,disparaging:-2.2,displeased:-1.9,dispute:-1.7,disputed:-1.4,disputes:-1.1,disputing:-1.7,disqualified:-1.8,disquiet:-1.3,disregard:-1.1,disregarded:-1.6,disregarding:-.9,disregards:-1.4,disrespect:-1.8,disrespected:-2,disruption:-1.5,disruptions:-1.4,disruptive:-1.3,dissatisfaction:-2.2,dissatisfactions:-1.9,dissatisfactory:-2,dissatisfied:-1.6,dissatisfies:-1.8,dissatisfy:-2.2,dissatisfying:-2.4,distort:-1.3,distorted:-1.7,distorting:-1.1,distorts:-1.4,distract:-1.2,distractable:-1.3,distracted:-1.4,distractedly:-.9,distractibility:-1.3,distractible:-1.5,distracting:-1.2,distractingly:-1.4,distraction:-1.6,distractions:-1,distractive:-1.6,distracts:-1.3,distraught:-2.6,distress:-2.4,distressed:-1.8,distresses:-1.6,distressful:-2.2,distressfully:-1.7,distressfulness:-2.4,distressing:-1.7,distressingly:-2.2,distrust:-1.8,distrusted:-2.4,distrustful:-2.1,distrustfully:-1.8,distrustfulness:-1.6,distrusting:-2.1,distrusts:-1.3,disturb:-1.7,disturbance:-1.6,disturbances:-1.4,disturbed:-1.6,disturber:-1.4,disturbers:-2.1,disturbing:-2.3,disturbingly:-2.3,disturbs:-1.9,dithering:-.5,divination:1.7,divinations:1.1,divinatory:1.6,divine:2.6,divined:.8,divinely:2.9,diviner:.3,diviners:1.2,divines:.8,divinest:2.7,diving:.3,divining:.9,divinise:.5,divinities:1.8,divinity:2.7,divinize:2.3,dizzy:-.9,dodging:-.4,dodgy:-.9,dolorous:-2.2,dominance:.8,dominances:-.1,dominantly:.2,dominants:.2,dominate:-.5,dominates:.2,dominating:-1.2,domination:-.2,dominations:-.3,dominative:-.7,dominators:-.4,dominatrices:-.2,dominatrix:-.5,dominatrixes:.6,doom:-1.7,doomed:-3.2,doomful:-2.1,dooming:-2.8,dooms:-1.1,doomsayer:-.7,doomsayers:-1.7,doomsaying:-1.5,doomsayings:-1.5,doomsday:-2.8,doomsdayer:-2.2,doomsdays:-2.4,doomster:-2.2,doomsters:-1.6,doomy:-1.1,dork:-1.4,dorkier:-1.1,dorkiest:-1.2,dorks:-.5,dorky:-1.1,doubt:-1.5,doubtable:-1.5,doubted:-1.1,doubter:-1.6,doubters:-1.3,doubtful:-1.4,doubtfully:-1.2,doubtfulness:-1.2,doubting:-1.4,doubtingly:-1.4,doubtless:.9,doubtlessly:1.2,doubtlessness:.8,doubts:-1.2,douche:-1.5,douchebag:-3,downcast:-1.8,downhearted:-2.3,downside:-1,drag:-.9,dragged:-.2,drags:-.7,drained:-1.5,dread:-2,dreaded:-2.7,dreadful:-1.9,dreadfully:-2.7,dreadfulness:-3.2,dreadfuls:-2.4,dreading:-2.4,dreadlock:-.4,dreadlocks:-.2,dreadnought:-.6,dreadnoughts:-.4,dreads:-1.4,dream:1,dreams:1.7,dreary:-1.4,droopy:-.8,drop:-1.1,drown:-2.7,drowned:-2.9,drowns:-2.2,drunk:-1.4,dubious:-1.5,dud:-1,dull:-1.7,dullard:-1.6,dullards:-1.8,dulled:-1.5,duller:-1.7,dullest:-1.7,dulling:-1.1,dullish:-1.1,dullness:-1.4,dullnesses:-1.9,dulls:-1,dullsville:-2.4,dully:-1.1,dumb:-2.3,dumbass:-2.6,dumbbell:-.8,dumbbells:-.2,dumbcane:-.3,dumbcanes:-.6,dumbed:-1.4,dumber:-1.5,dumbest:-2.3,dumbfound:-.1,dumbfounded:-1.6,dumbfounder:-1,dumbfounders:-1,dumbfounding:-.8,dumbfounds:-.3,dumbhead:-2.6,dumbheads:-1.9,dumbing:-.5,dumbly:-1.3,dumbness:-1.9,dumbs:-1.5,dumbstruck:-1,dumbwaiter:.2,dumbwaiters:-.1,dump:-1.6,dumpcart:-.6,dumped:-1.7,dumper:-1.2,dumpers:-.8,dumpier:-1.4,dumpiest:-1.6,dumpiness:-1.2,dumping:-1.3,dumpings:-1.1,dumpish:-1.8,dumpling:.4,dumplings:-.3,dumps:-1.7,dumpster:-.6,dumpsters:-1,dumpy:-1.7,dupe:-1.5,duped:-1.8,dwell:.5,dwelled:.4,dweller:.3,dwellers:-.3,dwelling:.1,dwells:-.1,dynamic:1.6,dynamical:1.2,dynamically:1.5,dynamics:1.1,dynamism:1.6,dynamisms:1.2,dynamist:1.4,dynamistic:1.5,dynamists:.9,dynamite:.7,dynamited:-.9,dynamiter:-1.2,dynamiters:.4,dynamites:-.3,dynamitic:.9,dynamiting:.2,dynamometer:.3,dynamometers:.3,dynamometric:.3,dynamometry:.6,dynamos:.3,dynamotor:.6,dysfunction:-1.8,eager:1.5,eagerly:1.6,eagerness:1.7,eagers:1.6,earnest:2.3,ease:1.5,eased:1.2,easeful:1.5,easefully:1.4,easel:.3,easement:1.6,easements:.4,eases:1.3,easier:1.8,easiest:1.8,easily:1.4,easiness:1.6,easing:1,easy:1.9,easygoing:1.3,easygoingness:1.5,ecstacy:3.3,ecstasies:2.3,ecstasy:2.9,ecstatic:2.3,ecstatically:2.8,ecstatics:2.9,eerie:-1.5,eery:-.9,effective:2.1,effectively:1.9,efficiencies:1.6,efficiency:1.5,efficient:1.8,efficiently:1.7,effin:-2.3,egotism:-1.4,egotisms:-1,egotist:-2.3,egotistic:-1.4,egotistical:-.9,egotistically:-1.8,egotists:-1.7,elated:3.2,elation:1.5,elegance:2.1,elegances:1.8,elegancies:1.6,elegancy:2.1,elegant:2.1,elegantly:1.9,embarrass:-1.2,embarrassable:-1.6,embarrassed:-1.5,embarrassedly:-1.1,embarrasses:-1.7,embarrassing:-1.6,embarrassingly:-1.7,embarrassment:-1.9,embarrassments:-1.7,embittered:-.4,embrace:1.3,emergency:-1.6,emotional:.6,empathetic:1.7,emptied:-.7,emptier:-.7,emptiers:-.7,empties:-.7,emptiest:-1.8,emptily:-1,emptiness:-1.9,emptinesses:-1.5,emptins:-.3,empty:-.8,emptying:-.6,enchanted:1.6,encourage:2.3,encouraged:1.5,encouragement:1.8,encouragements:2.1,encourager:1.5,encouragers:1.5,encourages:1.9,encouraging:2.4,encouragingly:2,endorse:1.3,endorsed:1,endorsement:1.3,endorses:1.4,enemies:-2.2,enemy:-2.5,energetic:1.9,energetically:1.8,energetics:.3,energies:.9,energise:2.2,energised:2.1,energises:2.2,energising:1.9,energization:1.6,energizations:1.5,energize:2.1,energized:2.3,energizer:2.1,energizers:1.7,energizes:2.1,energizing:2,energy:1.1,engage:1.4,engaged:1.7,engagement:2,engagements:.6,engager:1.1,engagers:1,engages:1,engaging:1.4,engagingly:1.5,engrossed:.6,enjoy:2.2,enjoyable:1.9,enjoyableness:1.9,enjoyably:1.8,enjoyed:2.3,enjoyer:2.2,enjoyers:2.2,enjoying:2.4,enjoyment:2.6,enjoyments:2,enjoys:2.3,enlighten:2.3,enlightened:2.2,enlightening:2.3,enlightens:1.7,ennui:-1.2,enrage:-2.6,enraged:-1.7,enrages:-1.8,enraging:-2.8,enrapture:3,enslave:-3.1,enslaved:-1.7,enslaves:-1.6,ensure:1.6,ensuring:1.1,enterprising:2.3,entertain:1.3,entertained:1.7,entertainer:1.6,entertainers:1,entertaining:1.9,entertainingly:1.9,entertainment:1.8,entertainments:2.3,entertains:2.4,enthral:.4,enthuse:1.6,enthused:2,enthuses:1.7,enthusiasm:1.9,enthusiasms:2,enthusiast:1.5,enthusiastic:2.2,enthusiastically:2.6,enthusiasts:1.4,enthusing:1.9,entitled:1.1,entrusted:.8,envied:-1.1,envier:-1,enviers:-1.1,envies:-.8,envious:-1.1,envy:-1.1,envying:-.8,envyingly:-1.3,erroneous:-1.8,error:-1.7,errors:-1.4,escape:.7,escapes:.5,escaping:.2,esteemed:1.9,ethical:2.3,euphoria:3.3,euphoric:3.2,eviction:-2,evil:-3.4,evildoer:-3.1,evildoers:-2.4,evildoing:-3.1,evildoings:-2.5,eviler:-2.1,evilest:-2.5,eviller:-2.9,evillest:-3.3,evilly:-3.4,evilness:-3.1,evils:-2.7,exaggerate:-.6,exaggerated:-.4,exaggerates:-.6,exaggerating:-.7,exasperated:-1.8,excel:2,excelled:2.2,excellence:3.1,excellences:2.5,excellencies:2.4,excellency:2.5,excellent:2.7,excellently:3.1,excelling:2.5,excels:2.5,excelsior:.7,excitabilities:1.5,excitability:1.2,excitable:1.5,excitableness:1,excitant:1.8,excitants:1.2,excitation:1.8,excitations:1.8,excitative:.3,excitatory:1.1,excite:2.1,excited:1.4,excitedly:2.3,excitement:2.2,excitements:1.9,exciter:1.9,exciters:1.4,excites:2.1,exciting:2.2,excitingly:1.9,exciton:.3,excitonic:.2,excitons:.8,excitor:.5,exclude:-.9,excluded:-1.4,exclusion:-1.2,exclusive:.5,excruciate:-2.7,excruciated:-1.3,excruciates:-1,excruciating:-3.3,excruciatingly:-2.9,excruciation:-3.4,excruciations:-1.9,excuse:.3,exempt:.4,exhaust:-1.2,exhausted:-1.5,exhauster:-1.3,exhausters:-1.3,exhaustibility:-.8,exhaustible:-1,exhausting:-1.5,exhaustion:-1.5,exhaustions:-1.1,exhaustive:-.5,exhaustively:-.7,exhaustiveness:-1.1,exhaustless:.2,exhaustlessness:.9,exhausts:-1.1,exhilarated:3,exhilarates:2.8,exhilarating:1.7,exonerate:1.8,exonerated:1.8,exonerates:1.6,exonerating:1,expand:1.3,expands:.4,expel:-1.9,expelled:-1,expelling:-1.6,expels:-1.6,exploit:-.4,exploited:-2,exploiting:-1.9,exploits:-1.4,exploration:.9,explorations:.3,expose:-.6,exposed:-.3,exposes:-.5,exposing:-1.1,extend:.7,extends:.5,exuberant:2.8,exultant:3,exultantly:1.4,fab:2,fabulous:2.4,fabulousness:2.8,fad:.9,fag:-2.1,faggot:-3.4,faggots:-3.2,fail:-2.5,failed:-2.3,failing:-2.3,failingly:-1.4,failings:-2.2,faille:.1,fails:-1.8,failure:-2.3,failures:-2,fainthearted:-.3,fair:1.3,faith:1.8,faithed:1.3,faithful:1.9,faithfully:1.8,faithfulness:1.9,faithless:-1,faithlessly:-.9,faithlessness:-1.8,faiths:1.8,fake:-2.1,fakes:-1.8,faking:-1.8,fallen:-1.5,falling:-.6,falsified:-1.6,falsify:-2,fame:1.9,fan:1.3,fantastic:2.6,fantastical:2,fantasticalities:2.1,fantasticality:1.7,fantasticalness:1.3,fantasticate:1.5,fantastico:.4,farce:-1.7,fascinate:2.4,fascinated:2.1,fascinates:2,fascination:2.2,fascinating:2.5,fascist:-2.6,fascists:-.8,fatal:-2.5,fatalism:-.6,fatalisms:-1.7,fatalist:-.5,fatalistic:-1,fatalists:-1.2,fatalities:-2.9,fatality:-3.5,fatally:-3.2,fatigue:-1,fatigued:-1.4,fatigues:-1.3,fatiguing:-1.2,fatiguingly:-1.5,fault:-1.7,faulted:-1.4,faultfinder:-.8,faultfinders:-1.5,faultfinding:-2.1,faultier:-2.1,faultiest:-2.1,faultily:-2,faultiness:-1.5,faulting:-1.4,faultless:2,faultlessly:2,faultlessness:1.1,faults:-2.1,faulty:-1.3,fav:2,fave:1.9,favor:1.7,favorable:2.1,favorableness:2.2,favorably:1.6,favored:1.8,favorer:1.3,favorers:1.4,favoring:1.8,favorite:2,favorited:1.7,favorites:1.8,favoritism:.7,favoritisms:.7,favors:1,favour:1.9,favoured:1.8,favourer:1.6,favourers:1.6,favouring:1.3,favours:1.8,fear:-2.2,feared:-2.2,fearful:-2.2,fearfuller:-2.2,fearfullest:-2.5,fearfully:-2.2,fearfulness:-1.8,fearing:-2.7,fearless:1.9,fearlessly:1.1,fearlessness:1.1,fears:-1.8,fearsome:-1.7,"fed up":-1.8,feeble:-1.2,feeling:.5,felonies:-2.5,felony:-2.5,ferocious:-.4,ferociously:-1.1,ferociousness:-1,ferocities:-1,ferocity:-.7,fervent:1.1,fervid:.5,festival:2.2,festivalgoer:1.3,festivalgoers:1.2,festivals:1.5,festive:2,festively:2.2,festiveness:2.4,festivities:2.1,festivity:2.2,feud:-1.4,feudal:-.8,feudalism:-.9,feudalisms:-.2,feudalist:-.9,feudalistic:-1.1,feudalities:-.4,feudality:-.5,feudalization:-.3,feudalize:-.5,feudalized:-.8,feudalizes:-.1,feudalizing:-.7,feudally:-.6,feudaries:-.3,feudary:-.8,feudatories:-.5,feudatory:-.1,feuded:-2.2,feuding:-1.6,feudist:-1.1,feudists:-.7,feuds:-1.4,fiasco:-2.3,fidgety:-1.4,fiery:-1.4,fiesta:2.1,fiestas:1.5,fight:-1.6,fighter:.6,fighters:-.2,fighting:-1.5,fightings:-1.9,fights:-1.7,fine:.8,fire:-1.4,fired:-2.6,firing:-1.4,fit:1.5,fitness:1.1,flagship:.4,flatter:.4,flattered:1.6,flatterer:-.3,flatterers:.3,flatteries:1.2,flattering:1.3,flatteringly:1,flatters:.6,flattery:.4,flawless:2.3,flawlessly:.8,flees:-.7,flexibilities:1,flexibility:1.4,flexible:.9,flexibly:1.3,flirtation:1.7,flirtations:-.1,flirtatious:.5,flirtatiously:-.1,flirtatiousness:.6,flirted:-.2,flirter:-.4,flirters:.6,flirtier:-.1,flirtiest:.4,flirting:.8,flirts:.7,flirty:.6,flop:-1.4,flops:-1.4,flu:-1.6,flunk:-1.3,flunked:-2.1,flunker:-1.9,flunkers:-1.6,flunkey:-1.8,flunkeys:-.6,flunkies:-1.4,flunking:-1.5,flunks:-1.8,flunky:-1.8,flustered:-1,focused:1.6,foe:-1.9,foehns:.2,foeman:-1.8,foemen:-.3,foes:-2,foetal:-.1,foetid:-2.3,foetor:-3,foetors:-2.1,foetus:.2,foetuses:.2,fond:1.9,fondly:1.9,fondness:2.5,fool:-1.9,fooled:-1.6,fooleries:-1.8,foolery:-1.8,foolfish:-.8,foolfishes:-.4,foolhardier:-1.5,foolhardiest:-1.3,foolhardily:-1,foolhardiness:-1.6,foolhardy:-1.4,fooling:-1.7,foolish:-1.1,foolisher:-1.7,foolishest:-1.4,foolishly:-1.8,foolishness:-1.8,foolishnesses:-2,foolproof:1.6,fools:-2.2,foolscaps:-.8,forbid:-1.3,forbiddance:-1.4,forbiddances:-1,forbidden:-1.8,forbidder:-1.6,forbidders:-1.5,forbidding:-1.9,forbiddingly:-1.9,forbids:-1.3,forced:-2,foreclosure:-.5,foreclosures:-2.4,forgave:1.4,forget:-.9,forgetful:-1.1,forgivable:1.7,forgivably:1.6,forgive:1.1,forgiven:1.6,forgiveness:1.1,forgiver:1.7,forgivers:1.2,forgives:1.7,forgiving:1.9,forgivingly:1.4,forgivingness:1.8,forgotten:-.9,fortunate:1.9,fought:-1.3,foughten:-1.9,frantic:-1.9,frantically:-1.4,franticness:-.7,fraud:-2.8,frauds:-2.3,fraudster:-2.5,fraudsters:-2.4,fraudulence:-2.3,fraudulent:-2.2,freak:-1.9,freaked:-1.2,freakier:-1.3,freakiest:-1.6,freakiness:-1.4,freaking:-1.8,freakish:-2.1,freakishly:-.8,freakishness:-1.4,freakout:-1.8,freakouts:-1.5,freaks:-.4,freaky:-1.5,free:2.3,freebase:-.1,freebased:.8,freebases:.8,freebasing:-.4,freebee:1.3,freebees:1.3,freebie:1.8,freebies:1.8,freeboard:.3,freeboards:.7,freeboot:-.7,freebooter:-1.7,freebooters:-.2,freebooting:-.8,freeborn:1.2,freed:1.7,freedman:1.1,freedmen:.7,freedom:3.2,freedoms:1.2,freedwoman:1.6,freedwomen:1.3,freeform:.9,freehand:.5,freehanded:1.4,freehearted:1.5,freehold:.7,freeholder:.5,freeholders:.1,freeholds:1,freeing:2.1,freelance:1.2,freelanced:.7,freelancer:1.1,freelancers:.4,freelances:.7,freelancing:.4,freeload:-1.9,freeloaded:-1.6,freeloader:-.7,freeloaders:-.1,freeloading:-1.3,freeloads:-1.3,freely:1.9,freeman:1.7,freemartin:-.5,freemasonries:.7,freemasonry:.3,freemen:1.5,freeness:1.6,freenesses:1.7,freer:1.1,freers:1,frees:1.2,freesia:.4,freesias:.4,freest:1.6,freestanding:1.1,freestyle:.7,freestyler:.4,freestylers:.8,freestyles:.3,freethinker:1,freethinkers:1,freethinking:1.1,freeware:.7,freeway:.2,freewheel:.5,freewheeled:.3,freewheeler:.2,freewheelers:-.3,freewheeling:.5,freewheelingly:.8,freewheels:.6,freewill:1,freewriting:.8,freeze:.2,freezers:-.1,freezes:-.1,freezing:-.4,freezingly:-1.6,frenzy:-1.3,fresh:1.3,friend:2.2,friended:1.7,friending:1.8,friendless:-1.5,friendlessness:-.3,friendlier:2,friendlies:2.2,friendliest:2.6,friendlily:1.8,friendliness:2,friendly:2.2,friends:2.1,friendship:1.9,friendships:1.6,fright:-1.6,frighted:-1.4,frighten:-1.4,frightened:-1.9,frightening:-2.2,frighteningly:-2.1,frightens:-1.7,frightful:-2.3,frightfully:-1.7,frightfulness:-1.9,frighting:-1.5,frights:-1.1,frisky:1,frowning:-1.4,frustrate:-2,frustrated:-2.4,frustrates:-1.9,frustrating:-1.9,frustratingly:-2,frustration:-2.1,frustrations:-2,fuck:-2.5,fucked:-3.4,fucker:-3.3,fuckers:-2.9,fuckface:-3.2,fuckhead:-3.1,fucks:-2.1,fucktard:-3.1,fud:-1.1,fuked:-2.5,fuking:-3.2,fulfill:1.9,fulfilled:1.8,fulfills:1,fume:-1.2,fumed:-1.8,fumeless:.3,fumelike:-.7,fumer:.7,fumers:-.8,fumes:-.1,fumet:.4,fumets:-.4,fumette:-.6,fuming:-2.7,fun:2.3,funeral:-1.5,funerals:-1.6,funky:-.4,funned:2.3,funnel:.1,funneled:.1,funnelform:.5,funneling:-.1,funnelled:-.1,funnelling:.1,funnels:.4,funner:2.2,funnest:2.9,funnier:1.7,funnies:1.3,funniest:2.6,funnily:1.9,funniness:1.8,funninesses:1.6,funning:1.8,funny:1.9,funnyman:1.4,funnymen:1.3,furious:-2.7,furiously:-1.9,fury:-2.7,futile:-1.9,gag:-1.4,gagged:-1.3,gain:2.4,gained:1.6,gaining:1.8,gains:1.4,gallant:1.7,gallantly:1.9,gallantry:2.6,geek:-.8,geekier:.2,geekiest:-.1,geeks:-.4,geeky:-.6,generosities:2.6,generosity:2.3,generous:2.3,generously:1.8,generousness:2.4,genial:1.8,gentle:1.9,gentler:1.4,gentlest:1.8,gently:2,ghost:-1.3,giddy:-.6,gift:1.9,giggle:1.8,giggled:1.5,giggler:.6,gigglers:1.4,giggles:.8,gigglier:1,giggliest:1.7,giggling:1.5,gigglingly:1.1,giggly:1,giver:1.4,givers:1.7,giving:1.4,glad:2,gladly:1.4,glamor:2.1,glamorise:1.3,glamorised:1.8,glamorises:2.1,glamorising:1.2,glamorization:1.6,glamorize:1.7,glamorized:2.1,glamorizer:2.4,glamorizers:1.6,glamorizes:2.4,glamorizing:1.8,glamorous:2.3,glamorously:2.1,glamors:1.4,glamour:2.4,glamourize:.8,glamourless:-1.6,glamourous:2,glamours:1.9,glee:3.2,gleeful:2.9,gloom:-2.6,gloomed:-1.9,gloomful:-2.1,gloomier:-1.5,gloomiest:-1.8,gloominess:-1.8,gloominesses:-1,glooming:-1.8,glooms:-.9,gloomy:-.6,gloried:2.4,glories:2.1,glorification:2,glorified:2.3,glorifier:2.3,glorifiers:1.6,glorifies:2.2,glorify:2.7,glorifying:2.4,gloriole:1.5,glorioles:1.2,glorious:3.2,gloriously:2.9,gloriousness:2.6,glory:2.5,glum:-2.1,gn8:.6,god:1.1,goddam:-2.5,goddammed:-2.4,goddamn:-2.1,goddamned:-1.8,goddamns:-2.1,goddams:-1.9,godsend:2.8,good:1.9,goodness:2,gorgeous:3,gorgeously:2.3,gorgeousness:2.9,gorgeousnesses:2.1,gossip:-.7,gossiped:-1.1,gossiper:-1.1,gossipers:-1.1,gossiping:-1.6,gossipmonger:-1,gossipmongers:-1.4,gossipped:-1.3,gossipping:-1.8,gossipries:-.8,gossipry:-1.2,gossips:-1.3,gossipy:-1.3,grace:1.8,graced:.9,graceful:2,gracefuller:2.2,gracefullest:2.8,gracefully:2.4,gracefulness:2.2,graces:1.6,gracile:1.7,graciles:.6,gracilis:.4,gracility:1.2,gracing:1.3,gracioso:1,gracious:2.6,graciously:2.3,graciousness:2.4,grand:2,grandee:1.1,grandees:1.2,grander:1.7,grandest:2.4,grandeur:2.4,grandeurs:2.1,grant:1.5,granted:1,granting:1.3,grants:.9,grateful:2,gratefuller:1.8,gratefully:2.1,gratefulness:2.2,graticule:.1,graticules:.2,gratification:1.6,gratifications:1.8,gratified:1.6,gratifies:1.5,gratify:1.3,gratifying:2.3,gratifyingly:2,gratin:.4,grating:-.4,gratingly:-.2,gratings:-.8,gratins:.2,gratis:.2,gratitude:2.3,gratz:2,grave:-1.6,graved:-.9,gravel:-.5,graveled:-.5,graveless:-1.3,graveling:-.4,gravelled:-.9,gravelling:-.4,gravelly:-.9,gravels:-.5,gravely:-1.5,graven:-.9,graveness:-1.5,graver:-1.1,gravers:-1.2,graves:-1.2,graveside:-.8,gravesides:-1.6,gravest:-1.3,gravestone:-.7,gravestones:-.5,graveyard:-1.2,graveyards:-1.2,great:3.1,greater:1.5,greatest:3.2,greed:-1.7,greedier:-2,greediest:-2.8,greedily:-1.9,greediness:-1.7,greeds:-1,greedy:-1.3,greenwash:-1.8,greenwashing:-.4,greet:1.3,greeted:1.1,greeting:1.6,greetings:1.8,greets:.6,grey:.2,grief:-2.2,grievance:-2.1,grievances:-1.5,grievant:-.8,grievants:-1.1,grieve:-1.6,grieved:-2,griever:-1.9,grievers:-.3,grieves:-2.1,grieving:-2.3,grievous:-2,grievously:-1.7,grievousness:-2.7,grim:-2.7,grimace:-1,grimaced:-2,grimaces:-1.8,grimacing:-1.4,grimalkin:-.9,grimalkins:-.9,grime:-1.5,grimed:-1.2,grimes:-1,grimier:-1.6,grimiest:-.7,grimily:-.7,griminess:-1.6,griming:-.7,grimly:-1.3,grimmer:-1.5,grimmest:-.8,grimness:-.8,grimy:-1.8,grin:2.1,grinned:1.1,grinner:1.1,grinners:1.6,grinning:1.5,grins:.9,gross:-2.1,grossed:-.4,grosser:-.3,grosses:-.8,grossest:-2.1,grossing:-.3,grossly:-.9,grossness:-1.8,grossular:-.3,grossularite:-.1,grossularites:-.7,grossulars:-.3,grouch:-2.2,grouched:-.8,grouches:-.9,grouchier:-2,grouchiest:-2.3,grouchily:-1.4,grouchiness:-2,grouching:-1.7,grouchy:-1.9,growing:.7,growth:1.6,guarantee:1,guilt:-1.1,guiltier:-2,guiltiest:-1.7,guiltily:-1.1,guiltiness:-1.8,guiltless:.8,guiltlessly:.7,guiltlessness:.6,guilts:-1.4,guilty:-1.8,gullibility:-1.6,gullible:-1.5,gun:-1.4,h8:-2.7,ha:1.4,hacked:-1.7,haha:2,hahaha:2.6,hahas:1.8,hail:.3,hailed:.9,hallelujah:3,handsome:2.2,handsomely:1.9,handsomeness:2.4,handsomer:2,handsomest:2.6,hapless:-1.4,haplessness:-1.4,happier:2.4,happiest:3.2,happily:2.6,happiness:2.6,happing:1.1,happy:2.7,harass:-2.2,harassed:-2.5,harasser:-2.4,harassers:-2.8,harasses:-2.5,harassing:-2.5,harassment:-2.5,harassments:-2.6,hard:-.4,hardier:-.6,hardship:-1.3,hardy:1.7,harm:-2.5,harmed:-2.1,harmfully:-2.6,harmfulness:-2.6,harming:-2.6,harmless:1,harmlessly:1.4,harmlessness:.8,harmonic:1.8,harmonica:.6,harmonically:2.1,harmonicas:.1,harmonicist:.5,harmonicists:.9,harmonics:1.5,harmonies:1.3,harmonious:2,harmoniously:1.9,harmoniousness:1.8,harmonise:1.8,harmonised:1.3,harmonising:1.4,harmonium:.9,harmoniums:.8,harmonization:1.9,harmonizations:.9,harmonize:1.7,harmonized:1.6,harmonizer:1.6,harmonizers:1.6,harmonizes:1.5,harmonizing:1.4,harmony:1.7,harms:-2.2,harried:-1.4,harsh:-1.9,harsher:-2.2,harshest:-2.9,hate:-2.7,hated:-3.2,hateful:-2.2,hatefully:-2.3,hatefulness:-3.6,hater:-1.8,haters:-2.2,hates:-1.9,hating:-2.3,hatred:-3.2,haunt:-1.7,haunted:-2.1,haunting:-1.1,haunts:-1,havoc:-2.9,healthy:1.7,heartbreak:-2.7,heartbreaker:-2.2,heartbreakers:-2.1,heartbreaking:-2,heartbreakingly:-1.8,heartbreaks:-1.8,heartbroken:-3.3,heartfelt:2.5,heartless:-2.2,heartlessly:-2.8,heartlessness:-2.8,heartwarming:2.1,heaven:2.3,heavenlier:3,heavenliest:2.7,heavenliness:2.7,heavenlinesses:2.3,heavenly:3,heavens:1.7,heavenward:1.4,heavenwards:1.2,heavyhearted:-2.1,heh:-.6,hell:-3.6,hellish:-3.2,help:1.7,helper:1.4,helpers:1.1,helpful:1.8,helpfully:2.3,helpfulness:1.9,helping:1.2,helpless:-2,helplessly:-1.4,helplessness:-2.1,helplessnesses:-1.7,helps:1.6,hero:2.6,heroes:2.3,heroic:2.6,heroical:2.9,heroically:2.4,heroicomic:1,heroicomical:1.1,heroics:2.4,heroin:-2.2,heroine:2.7,heroines:1.8,heroinism:-2,heroism:2.8,heroisms:2.2,heroize:2.1,heroized:2,heroizes:2.2,heroizing:1.9,heron:.1,heronries:.7,heronry:.1,herons:.5,heros:1.3,hesitance:-.9,hesitancies:-1,hesitancy:-.9,hesitant:-1,hesitantly:-1.2,hesitate:-1.1,hesitated:-1.3,hesitater:-1.4,hesitaters:-1.4,hesitates:-1.4,hesitating:-1.4,hesitatingly:-1.5,hesitation:-1.1,hesitations:-1.1,hid:-.4,hide:-.7,hides:-.7,hiding:-1.2,highlight:1.4,hilarious:1.7,hindrance:-1.7,hoax:-1.1,holiday:1.7,holidays:1.6,homesick:-.7,homesickness:-1.8,homesicknesses:-1.8,honest:2.3,honester:1.9,honestest:3,honesties:1.8,honestly:2,honesty:2.2,honor:2.2,honorability:2.2,honorable:2.5,honorableness:2.2,honorably:2.4,honoraria:.6,honoraries:1.5,honorarily:1.9,honorarium:.7,honorariums:1,honorary:1.4,honored:2.8,honoree:2.1,honorees:2.3,honorer:1.7,honorers:1.3,honorific:1.4,honorifically:2.2,honorifics:1.7,honoring:2.3,honors:2.3,honour:2.7,honourable:2.1,honoured:2.2,honourer:1.8,honourers:1.6,honouring:2.1,honours:2.2,hooligan:-1.5,hooliganism:-2.1,hooligans:-1.1,hooray:2.3,hope:1.9,hoped:1.6,hopeful:2.3,hopefully:1.7,hopefulness:1.6,hopeless:-2,hopelessly:-2.2,hopelessness:-3.1,hopes:1.8,hoping:1.8,horrendous:-2.8,horrendously:-1.9,horrent:-.9,horrible:-2.5,horribleness:-2.4,horribles:-2.1,horribly:-2.4,horrid:-2.5,horridly:-1.4,horridness:-2.3,horridnesses:-3,horrific:-3.4,horrifically:-2.9,horrified:-2.5,horrifies:-2.9,horrify:-2.5,horrifying:-2.7,horrifyingly:-3.3,horror:-2.7,horrors:-2.7,hostile:-1.6,hostilely:-2.2,hostiles:-1.3,hostilities:-2.1,hostility:-2.5,huckster:-.9,hug:2.1,huge:1.3,huggable:1.6,hugged:1.7,hugger:1.6,huggers:1.8,hugging:1.8,hugs:2.2,humerous:1.4,humiliate:-2.5,humiliated:-1.4,humiliates:-1,humiliating:-1.2,humiliatingly:-2.6,humiliation:-2.7,humiliations:-2.4,humor:1.1,humoral:.6,humored:1.2,humoresque:1.2,humoresques:.9,humoring:2.1,humorist:1.2,humoristic:1.5,humorists:1.3,humorless:-1.3,humorlessness:-1.4,humorous:1.6,humorously:2.3,humorousness:2.4,humors:1.6,humour:2.1,humoured:1.1,humouring:1.7,humourous:2,hunger:-1,hurrah:2.6,hurrahed:1.9,hurrahing:2.4,hurrahs:2.1,hurray:2.7,hurrayed:1.8,hurraying:1.2,hurrays:2.4,hurt:-2.4,hurter:-2.3,hurters:-1.9,hurtful:-2.4,hurtfully:-2.6,hurtfulness:-1.9,hurting:-1.7,hurtle:-.3,hurtled:-.6,hurtles:-1,hurtless:.3,hurtling:-1.4,hurts:-2.1,hypocritical:-2,hysteria:-1.9,hysterical:-.1,hysterics:-1.8,ideal:2.4,idealess:-1.9,idealise:1.4,idealised:2.1,idealises:2,idealising:.6,idealism:1.7,idealisms:.8,idealist:1.6,idealistic:1.8,idealistically:1.7,idealists:.7,idealities:1.5,ideality:1.9,idealization:1.8,idealizations:1.4,idealize:1.2,idealized:1.8,idealizer:1.3,idealizers:1.9,idealizes:2,idealizing:1.4,idealless:-1.7,ideally:1.8,idealogues:.5,idealogy:.8,ideals:.8,idiot:-2.3,idiotic:-2.6,ignorable:-1,ignorami:-1.9,ignoramus:-1.9,ignoramuses:-2.3,ignorance:-1.5,ignorances:-1.2,ignorant:-1.1,ignorantly:-1.6,ignorantness:-1.1,ignore:-1.5,ignored:-1.3,ignorer:-1.3,ignorers:-.7,ignores:-1.1,ignoring:-1.7,ill:-1.8,illegal:-2.6,illiteracy:-1.9,illness:-1.7,illnesses:-2.2,imbecile:-2.2,immobilized:-1.2,immoral:-2,immoralism:-1.6,immoralist:-2.1,immoralists:-1.7,immoralities:-1.1,immorality:-.6,immorally:-2.1,immortal:1,immune:1.2,impatience:-1.8,impatiens:-.2,impatient:-1.2,impatiently:-1.7,imperfect:-1.3,impersonal:-1.3,impolite:-1.6,impolitely:-1.8,impoliteness:-1.8,impolitenesses:-2.3,importance:1.5,importancies:.4,importancy:1.4,important:.8,importantly:1.3,impose:-1.2,imposed:-.3,imposes:-.4,imposing:-.4,impotent:-1.1,impress:1.9,impressed:2.1,impresses:2.1,impressibility:1.2,impressible:.8,impressing:2.5,impression:.9,impressionable:.2,impressionism:.8,impressionisms:.5,impressionist:1,impressionistic:1.5,impressionistically:1.6,impressionists:.5,impressions:.9,impressive:2.3,impressively:2,impressiveness:1.7,impressment:-.4,impressments:.5,impressure:.6,imprisoned:-2,improve:1.9,improved:2.1,improvement:2,improvements:1.3,improver:1.8,improvers:1.3,improves:1.8,improving:1.8,inability:-1.7,inaction:-1,inadequacies:-1.7,inadequacy:-1.7,inadequate:-1.7,inadequately:-1,inadequateness:-1.7,inadequatenesses:-1.6,incapable:-1.6,incapacitated:-1.9,incensed:-2,incentive:1.5,incentives:1.3,incompetence:-2.3,incompetent:-2.1,inconsiderate:-1.9,inconvenience:-1.5,inconvenient:-1.4,increase:1.3,increased:1.1,indecision:-.8,indecisions:-1.1,indecisive:-1,indecisively:-.7,indecisiveness:-1.3,indecisivenesses:-.9,indestructible:.6,indifference:-.2,indifferent:-.8,indignant:-1.8,indignation:-2.4,indoctrinate:-1.4,indoctrinated:-.4,indoctrinates:-.6,indoctrinating:-.7,ineffective:-.5,ineffectively:-1.3,ineffectiveness:-1.3,ineffectual:-1.2,ineffectuality:-1.6,ineffectually:-1.1,ineffectualness:-1.3,infatuated:.2,infatuation:.6,infected:-2.2,inferior:-1.7,inferiorities:-1.9,inferiority:-1.1,inferiorly:-2,inferiors:-.5,inflamed:-1.4,influential:1.9,infringement:-2.1,infuriate:-2.2,infuriated:-3,infuriates:-2.6,infuriating:-2.4,inhibin:-.2,inhibit:-1.6,inhibited:-.4,inhibiting:-.4,inhibition:-1.5,inhibitions:-.8,inhibitive:-1.4,inhibitor:-.3,inhibitors:-1,inhibitory:-1,inhibits:-.9,injured:-1.7,injury:-1.8,injustice:-2.7,innocence:1.6,innocency:1.9,innocent:1.4,innocenter:.9,innocently:1.4,innocents:1.1,innovate:2.2,innovates:2,innovation:1.6,innovative:1.9,inquisition:-1.2,inquisitive:.7,insane:-1.7,insanity:-2.7,insecure:-1.8,insecurely:-1.4,insecureness:-1.8,insecurities:-1.8,insecurity:-1.8,insensitive:-.9,insensitivity:-1.8,insignificant:-1.4,insincere:-1.8,insincerely:-1.9,insincerity:-1.4,insipid:-2,inspiration:2.4,inspirational:2.3,inspirationally:2.3,inspirations:2.1,inspirator:1.9,inspirators:1.2,inspiratory:1.5,inspire:2.7,inspired:2.2,inspirer:2.2,inspirers:2,inspires:1.9,inspiring:1.8,inspiringly:2.6,inspirit:1.9,inspirited:1.3,inspiriting:1.8,inspiritingly:2.1,inspirits:.8,insult:-2.3,insulted:-2.3,insulter:-2,insulters:-2,insulting:-2.2,insultingly:-2.3,insults:-1.8,intact:.8,integrity:1.6,intellect:2,intellection:.6,intellections:.8,intellective:1.7,intellectively:.8,intellects:1.8,intellectual:2.3,intellectualism:2.2,intellectualist:2,intellectualistic:1.3,intellectualists:.8,intellectualities:1.7,intellectuality:1.7,intellectualization:1.5,intellectualize:1.5,intellectualized:1.2,intellectualizes:1.8,intellectualizing:.8,intellectually:1.4,intellectualness:1.5,intellectuals:1.6,intelligence:2.1,intelligencer:1.5,intelligencers:1.6,intelligences:1.6,intelligent:2,intelligential:1.9,intelligently:2,intelligentsia:1.5,intelligibility:1.5,intelligible:1.4,intelligibleness:1.5,intelligibly:1.2,intense:.3,interest:2,interested:1.7,interestedly:1.5,interesting:1.7,interestingly:1.7,interestingness:1.8,interests:1,interrogated:-1.6,interrupt:-1.4,interrupted:-1.2,interrupter:-1.1,interrupters:-1.3,interruptible:-1.3,interrupting:-1.2,interruption:-1.5,interruptions:-1.7,interruptive:-1.4,interruptor:-1.3,interrupts:-1.3,intimidate:-.8,intimidated:-1.9,intimidates:-1.3,intimidating:-1.9,intimidatingly:-1.1,intimidation:-1.8,intimidations:-1.4,intimidator:-1.6,intimidators:-1.6,intimidatory:-1.1,intricate:.6,intrigues:.9,invigorate:1.9,invigorated:.8,invigorates:2.1,invigorating:2.1,invigoratingly:2,invigoration:1.5,invigorations:1.2,invigorator:1.1,invigorators:1.2,invincible:2.2,invite:.6,inviting:1.3,invulnerable:1.3,irate:-2.9,ironic:-.5,irony:-.2,irrational:-1.4,irrationalism:-1.5,irrationalist:-2.1,irrationalists:-1.5,irrationalities:-1.5,irrationality:-1.7,irrationally:-1.6,irrationals:-1.1,irresistible:1.4,irresolute:-1.4,irresponsible:-1.9,irreversible:-.8,irritabilities:-1.7,irritability:-1.4,irritable:-2.1,irritableness:-1.7,irritably:-1.8,irritant:-2.3,irritants:-2.1,irritate:-1.8,irritated:-2,irritates:-1.7,irritating:-2,irritatingly:-2,irritation:-2.3,irritations:-1.5,irritative:-2,isolatable:.2,isolate:-.8,isolated:-1.3,isolates:-1.3,isolation:-1.7,isolationism:.4,isolationist:.7,isolations:-.5,isolator:-.4,isolators:-.4,itchy:-1.1,jackass:-1.8,jackasses:-2.8,jaded:-1.6,jailed:-2.2,jaunty:1.2,jealous:-2,jealousies:-2,jealously:-2,jealousness:-1.7,jealousy:-1.3,jeopardy:-2.1,jerk:-1.4,jerked:-.8,jerks:-1.1,jewel:1.5,jewels:2,jocular:1.2,join:1.2,joke:1.2,joked:1.3,joker:.5,jokes:1,jokester:1.5,jokesters:.9,jokey:1.1,joking:.9,jollied:2.4,jollier:2.4,jollies:2,jolliest:2.9,jollification:2.2,jollifications:2,jollify:2.1,jollily:2.7,jolliness:2.5,jollities:1.7,jollity:1.8,jolly:2.3,jollying:2.3,jovial:1.9,joy:2.8,joyance:2.3,joyed:2.9,joyful:2.9,joyfuller:2.4,joyfully:2.5,joyfulness:2.7,joying:2.5,joyless:-2.5,joylessly:-1.7,joylessness:-2.7,joyous:3.1,joyously:2.9,joyousness:2.8,joypop:-.2,joypoppers:-.1,joyridden:.6,joyride:1.1,joyrider:.7,joyriders:1.3,joyrides:.8,joyriding:.9,joyrode:1,joys:2.2,joystick:.7,joysticks:.2,jubilant:3,jumpy:-1,justice:2.4,justifiably:1,justified:1.7,keen:1.5,keened:.3,keener:.5,keeners:.6,keenest:1.9,keening:-.7,keenly:1,keenness:1.4,keens:.1,kewl:1.3,kidding:.4,kill:-3.7,killdeer:-1.1,killdeers:-.1,killdees:-.6,killed:-3.5,killer:-3.3,killers:-3.3,killick:.1,killie:-.1,killifish:-.1,killifishes:-.1,killing:-3.4,killingly:-2.6,killings:-3.5,killjoy:-2.1,killjoys:-1.7,killock:-.3,killocks:-.4,kills:-2.5,kind:2.4,kinder:2.2,kindly:2.2,kindness:2,kindnesses:2.3,kiss:1.8,kissable:2,kissably:1.9,kissed:1.6,kisser:1.7,kissers:1.5,kisses:2.3,kissing:2.7,kissy:1.8,kudos:2.3,lack:-1.3,lackadaisical:-1.6,lag:-1.4,lagged:-1.2,lagging:-1.1,lags:-1.5,laidback:.5,lame:-1.8,lamebrain:-1.6,lamebrained:-2.5,lamebrains:-1.2,lamedh:.1,lamella:-.1,lamellae:-.1,lamellas:.1,lamellibranch:.2,lamellibranchs:-.1,lamely:-2,lameness:-.8,lament:-2,lamentable:-1.5,lamentableness:-1.3,lamentably:-1.5,lamentation:-1.4,lamentations:-1.9,lamented:-1.4,lamenter:-1.2,lamenters:-.5,lamenting:-2,laments:-1.5,lamer:-1.4,lames:-1.2,lamest:-1.5,landmark:.3,laugh:2.6,laughable:.2,laughableness:1.2,laughably:1.2,laughed:2,laugher:1.7,laughers:1.7,laughing:2.2,laughingly:2.3,laughings:1.9,laughingstocks:-1.3,laughs:2.2,laughter:2.2,laughters:2.2,launched:.5,lawl:1.4,lawsuit:-.9,lawsuits:-.6,lazier:-2.3,laziest:-2.7,lazy:-1.5,leak:-1.4,leaked:-1.3,leave:-.2,leet:1.3,legal:.5,legally:.4,lenient:1.1,lethargic:-1.2,lethargy:-1.4,liabilities:-.8,liability:-.8,liar:-2.3,liards:-.4,liars:-2.4,libelous:-2.1,libertarian:.9,libertarianism:.4,libertarianisms:.1,libertarians:.1,liberties:2.3,libertinage:.2,libertine:-.9,libertines:.4,libertinisms:1.2,liberty:2.4,lied:-1.6,lies:-1.8,lifesaver:2.8,lighthearted:1.8,like:1.5,likeable:2,liked:1.8,likes:1.8,liking:1.7,limitation:-1.2,limited:-.9,litigation:-.8,litigious:-.8,livelier:1.7,liveliest:2.1,livelihood:.8,livelihoods:.9,livelily:1.8,liveliness:1.6,livelong:1.7,lively:1.9,livid:-2.5,lmao:2.9,loathe:-2.2,loathed:-2.1,loathes:-1.9,loathing:-2.7,lobby:.1,lobbying:-.3,lol:1.8,lone:-1.1,lonelier:-1.4,loneliest:-2.4,loneliness:-1.8,lonelinesses:-1.5,lonely:-1.5,loneness:-1.1,loner:-1.3,loners:-.9,lonesome:-1.5,lonesomely:-1.3,lonesomeness:-1.8,lonesomes:-1.4,longing:-.1,longingly:.7,longings:.4,loom:-.9,loomed:-1.1,looming:-.5,looms:-.6,loose:-1.3,looses:-.6,lose:-1.7,loser:-2.4,losers:-2.4,loses:-1.3,losing:-1.6,loss:-1.3,losses:-1.7,lossy:-1.2,lost:-1.3,louse:-1.6,loused:-1,louses:-1.3,lousewort:.1,louseworts:-.6,lousier:-2.2,lousiest:-2.6,lousily:-1.2,lousiness:-1.7,lousing:-1.1,lousy:-2.5,lovable:3,love:3.2,loved:2.9,lovelies:2.2,lovely:2.8,lover:2.8,loverly:2.8,lovers:2.4,loves:2.7,loving:2.9,lovingly:3.2,lovingness:2.7,low:-1.1,lowball:-.8,lowballed:-1.5,lowballing:-.7,lowballs:-1.2,lowborn:-.7,lowboys:-.6,lowbred:-2.6,lowbrow:-1.9,lowbrows:-.6,lowdown:-.8,lowdowns:-.2,lowe:.5,lowed:-.8,lower:-1.2,lowercase:.3,lowercased:-.2,lowerclassman:-.4,lowered:-.5,lowering:-1,lowermost:-1.4,lowers:-.5,lowery:-1.8,lowest:-1.6,lowing:-.5,lowish:-.9,lowland:-.1,lowlander:-.4,lowlanders:-.3,lowlands:-.1,lowlier:-1.7,lowliest:-1.8,lowlife:-1.5,lowlifes:-2.2,lowlight:-2,lowlights:-.3,lowlihead:-.3,lowliness:-1.1,lowlinesses:-1.2,lowlives:-2.1,lowly:-1,lown:.9,lowness:-1.3,lowrider:-.2,lowriders:.1,lows:-.8,lowse:-.7,loyal:2.1,loyalism:1,loyalisms:.9,loyalist:1.5,loyalists:1.1,loyally:2.1,loyalties:1.9,loyalty:2.5,luck:2,lucked:1.9,luckie:1.6,luckier:1.9,luckiest:2.9,luckily:2.3,luckiness:1,lucking:1.2,luckless:-1.3,lucks:1.6,lucky:1.8,ludicrous:-1.5,ludicrously:-.2,ludicrousness:-1.9,lugubrious:-2.1,lulz:2,lunatic:-2.2,lunatics:-1.6,lurk:-.8,lurking:-.5,lurks:-.9,lying:-2.4,mad:-2.2,maddening:-2.2,madder:-1.2,maddest:-2.8,madly:-1.7,madness:-1.9,magnific:2.3,magnifical:2.4,magnifically:2.4,magnification:1,magnifications:1.2,magnificence:2.4,magnificences:2.3,magnificent:2.9,magnificently:3.4,magnifico:1.8,magnificoes:1.4,mandatory:.3,maniac:-2.1,maniacal:-.3,maniacally:-1.7,maniacs:-1.2,manipulated:-1.6,manipulating:-1.5,manipulation:-1.2,marvel:1.8,marvelous:2.9,marvels:2,masochism:-1.6,masochisms:-1.1,masochist:-1.7,masochistic:-2.2,masochistically:-1.6,masochists:-1.2,masterpiece:3.1,masterpieces:2.5,matter:.1,matters:.1,mature:1.8,meaningful:1.3,meaningless:-1.9,medal:2.1,mediocrity:-.3,meditative:1.4,meh:-.3,melancholia:-.5,melancholiac:-2,melancholias:-1.6,melancholic:-.3,melancholics:-1,melancholies:-1.1,melancholy:-1.9,menace:-2.2,menaced:-1.7,mercy:1.5,merit:1.8,merited:1.4,meriting:1.1,meritocracy:.6,meritocrat:.4,meritocrats:1.1,meritorious:2.1,meritoriously:1.3,meritoriousness:1.7,merits:1.7,merrier:1.7,merriest:2.7,merrily:2.4,merriment:2.4,merriments:2,merriness:2.2,merry:2.5,merrymaker:2.2,merrymakers:1.7,merrymaking:2.2,merrymakings:2.4,merrythought:1.1,merrythoughts:1.6,mess:-1.5,messed:-1.4,messy:-1.5,methodical:.6,mindless:-1.9,miracle:2.8,mirth:2.6,mirthful:2.7,mirthfully:2,misbehave:-1.9,misbehaved:-1.6,misbehaves:-1.6,misbehaving:-1.7,mischief:-1.5,mischiefs:-.8,miser:-1.8,miserable:-2.2,miserableness:-2.8,miserably:-2.1,miserere:-.8,misericorde:.1,misericordes:-.5,miseries:-2.7,miserliness:-2.6,miserly:-1.4,misers:-1.5,misery:-2.7,misgiving:-1.4,misinformation:-1.3,misinformed:-1.6,misinterpreted:-1.3,misleading:-1.7,misread:-1.1,misreporting:-1.5,misrepresentation:-2,miss:-.6,missed:-1.2,misses:-.9,missing:-1.2,mistakable:-.8,mistake:-1.4,mistaken:-1.5,mistakenly:-1.2,mistaker:-1.6,mistakers:-1.6,mistakes:-1.5,mistaking:-1.1,misunderstand:-1.5,misunderstanding:-1.8,misunderstands:-1.3,misunderstood:-1.4,mlm:-1.4,mmk:.6,moan:-.6,moaned:-.4,moaning:-.4,moans:-.6,mock:-1.8,mocked:-1.3,mocker:-.8,mockeries:-1.6,mockers:-1.3,mockery:-1.3,mocking:-1.7,mocks:-2,molest:-2.1,molestation:-1.9,molestations:-2.9,molested:-1.9,molester:-2.3,molesters:-2.2,molesting:-2.8,molests:-3.1,mongering:-.8,monopolize:-.8,monopolized:-.9,monopolizes:-1.1,monopolizing:-.5,mooch:-1.7,mooched:-1.4,moocher:-1.5,moochers:-1.9,mooches:-1.4,mooching:-1.7,moodier:-1.1,moodiest:-2.1,moodily:-1.3,moodiness:-1.4,moodinesses:-1.4,moody:-1.5,mope:-1.9,moping:-1,moron:-2.2,moronic:-2.7,moronically:-1.4,moronity:-1.1,morons:-1.3,motherfucker:-3.6,motherfucking:-2.8,motivate:1.6,motivated:2,motivating:2.2,motivation:1.4,mourn:-1.8,mourned:-1.3,mourner:-1.6,mourners:-1.8,mournful:-1.6,mournfuller:-1.9,mournfully:-1.7,mournfulness:-1.8,mourning:-1.9,mourningly:-2.3,mourns:-2.4,muah:2.3,mumpish:-1.4,murder:-3.7,murdered:-3.4,murderee:-3.2,murderees:-3.1,murderer:-3.6,murderers:-3.3,murderess:-2.2,murderesses:-2.6,murdering:-3.3,murderous:-3.2,murderously:-3.1,murderousness:-2.9,murders:-3,n00b:-1.6,nag:-1.5,nagana:-1.7,nagged:-1.7,nagger:-1.8,naggers:-1.5,naggier:-1.4,naggiest:-2.4,nagging:-1.7,naggingly:-.9,naggy:-1.7,nags:-1.1,nah:-.4,naive:-1.1,nastic:.2,nastier:-2.3,nasties:-2.1,nastiest:-2.4,nastily:-1.9,nastiness:-1.1,nastinesses:-2.6,nasturtium:.4,nasturtiums:.1,nasty:-2.6,natural:1.5,neat:2,neaten:1.2,neatened:2,neatening:1.3,neatens:1.1,neater:1,neatest:1.7,neath:.2,neatherd:-.4,neatly:1.4,neatness:1.3,neats:1.1,needy:-1.4,negative:-2.7,negativity:-2.3,neglect:-2,neglected:-2.4,neglecter:-1.7,neglecters:-1.5,neglectful:-2,neglectfully:-2.1,neglectfulness:-2,neglecting:-1.7,neglects:-2.2,nerd:-1.2,nerdier:-.2,nerdiest:.6,nerdish:-.1,nerdy:-.2,nerves:-.4,nervous:-1.1,nervously:-.6,nervousness:-1.2,neurotic:-1.4,neurotically:-1.8,neuroticism:-.9,neurotics:-.7,nice:1.8,nicely:1.9,niceness:1.6,nicenesses:2.1,nicer:1.9,nicest:2.2,niceties:1.5,nicety:1.2,nifty:1.7,niggas:-1.4,nigger:-3.3,no:-1.2,noble:2,noisy:-.7,nonsense:-1.7,noob:-.2,nosey:-.8,notorious:-1.9,novel:1.3,numb:-1.4,numbat:.2,numbed:-.9,number:.3,numberable:.6,numbest:-1,numbfish:-.4,numbfishes:-.7,numbing:-1.1,numbingly:-1.3,numbles:.4,numbly:-1.4,numbness:-1.1,numbs:-.7,numbskull:-2.3,numbskulls:-2.2,nurtural:1.5,nurturance:1.6,nurturances:1.3,nurturant:1.7,nurture:1.4,nurtured:1.9,nurturer:1.9,nurturers:.8,nurtures:1.9,nurturing:2,nuts:-1.3,"o.o":-.8,"o/\\o":2.1,o_0:-.1,obliterate:-2.9,obliterated:-2.1,obnoxious:-2,obnoxiously:-2.3,obnoxiousness:-2.1,obscene:-2.8,obsess:-1,obsessed:-.7,obsesses:-1,obsessing:-1.4,obsession:-1.4,obsessional:-1.5,obsessionally:-1.3,obsessions:-.9,obsessive:-.9,obsessively:-.4,obsessiveness:-1.2,obsessives:-.7,obsolete:-1.2,obstacle:-1.5,obstacles:-1.6,obstinate:-1.2,odd:-1.3,offence:-1.2,offences:-1.4,offend:-1.2,offended:-1,offender:-1.5,offenders:-1.5,offending:-2.3,offends:-2,offense:-1,offenseless:.7,offenses:-1.5,offensive:-2,offensively:-2.8,offensiveness:-2.3,offensives:-.8,offline:-.5,ok:1.2,okay:.9,okays:2.1,ominous:-1.4,"once-in-a-lifetime":1.8,openness:1.4,opportune:1.7,opportunely:1.5,opportuneness:1.2,opportunism:.4,opportunisms:.2,opportunist:.2,opportunistic:-.1,opportunistically:.9,opportunists:.3,opportunities:1.6,opportunity:1.8,oppressed:-2.1,oppressive:-1.7,optimal:1.5,optimality:1.9,optimally:1.3,optimisation:1.6,optimisations:1.8,optimise:1.9,optimised:1.7,optimises:1.6,optimising:1.7,optimism:2.5,optimisms:2,optimist:2.4,optimistic:1.3,optimistically:2.1,optimists:1.6,optimization:1.6,optimizations:.9,optimize:2.2,optimized:2,optimizer:1.5,optimizers:2.1,optimizes:1.8,optimizing:2,optionless:-1.7,original:1.3,outcry:-2.3,outgoing:1.2,outmaneuvered:.5,outrage:-2.3,outraged:-2.5,outrageous:-2,outrageously:-1.2,outrageousness:-1.2,outrageousnesses:-1.3,outrages:-2.3,outraging:-2,outreach:1.1,outstanding:3,overjoyed:2.7,overload:-1.5,overlooked:-.1,overreact:-1,overreacted:-1.7,overreaction:-.7,overreacts:-2.2,oversell:-.9,overselling:-.8,oversells:.3,oversimplification:.2,oversimplifies:.1,oversimplify:-.6,overstatement:-1.1,overstatements:-.7,overweight:-1.5,overwhelm:-.7,overwhelmed:.2,overwhelmingly:-.5,overwhelms:-.8,oxymoron:-.5,pain:-2.3,pained:-1.8,painful:-1.9,painfuller:-1.7,painfully:-2.4,painfulness:-2.7,paining:-1.7,painless:1.2,painlessly:1.1,painlessness:.4,pains:-1.8,palatable:1.6,palatableness:.8,palatably:1.1,panic:-2.3,panicked:-2,panicking:-1.9,panicky:-1.5,panicle:.5,panicled:.1,panicles:-.2,panics:-1.9,paniculate:.1,panicums:-.1,paradise:3.2,paradox:-.4,paranoia:-1,paranoiac:-1.3,paranoiacs:-.7,paranoias:-1.5,paranoid:-1,paranoids:-1.6,pardon:1.3,pardoned:.9,pardoning:1.7,pardons:1.2,parley:-.4,partied:1.4,partier:1.4,partiers:.7,parties:1.7,party:1.7,partyer:1.2,partyers:1.1,partying:1.6,passion:2,passional:1.6,passionate:2.4,passionately:2.4,passionateness:2.3,passionflower:.3,passionflowers:.4,passionless:-1.9,passions:2.2,passive:.8,passively:-.7,pathetic:-2.7,pathetical:-1.2,pathetically:-1.8,pay:-.4,peace:2.5,peaceable:1.7,peaceableness:1.8,peaceably:2,peaceful:2.2,peacefuller:1.9,peacefullest:3.1,peacefully:2.4,peacefulness:2.1,peacekeeper:1.6,peacekeepers:1.6,peacekeeping:2,peacekeepings:1.6,peacemaker:2,peacemakers:2.4,peacemaking:1.7,peacenik:.8,peaceniks:.7,peaces:2.1,peacetime:2.2,peacetimes:2.1,peculiar:.6,peculiarities:.1,peculiarity:.6,peculiarly:-.4,penalty:-2,pensive:.3,perfect:2.7,perfecta:1.4,perfectas:.6,perfected:2.7,perfecter:1.8,perfecters:1.4,perfectest:3.1,perfectibilities:2.1,perfectibility:1.8,perfectible:1.5,perfecting:2.3,perfection:2.7,perfectionism:1.3,perfectionist:1.5,perfectionistic:.7,perfectionists:.1,perfections:2.5,perfective:1.2,perfectively:2.1,perfectiveness:.9,perfectives:.9,perfectivity:2.2,perfectly:3.2,perfectness:3,perfecto:1.3,perfects:1.6,peril:-1.7,perjury:-1.9,perpetrator:-2.2,perpetrators:-1,perplexed:-1.3,persecute:-2.1,persecuted:-1.3,persecutes:-1.2,persecuting:-1.5,perturbed:-1.4,perverse:-1.8,perversely:-2.2,perverseness:-2.1,perversenesses:-.5,perversion:-1.3,perversions:-1.2,perversities:-1.1,perversity:-2.6,perversive:-2.1,pervert:-2.3,perverted:-2.5,pervertedly:-1.2,pervertedness:-1.2,perverter:-1.7,perverters:-.6,perverting:-1,perverts:-2.8,pesky:-1.2,pessimism:-1.5,pessimisms:-2,pessimist:-1.5,pessimistic:-1.5,pessimistically:-2,pessimists:-1,petrifaction:-1.9,petrifactions:-.3,petrification:-.1,petrifications:-.4,petrified:-2.5,petrifies:-2.3,petrify:-1.7,petrifying:-2.6,pettier:-.3,pettiest:-1.3,petty:-.8,phobia:-1.6,phobias:-2,phobic:-1.2,phobics:-1.3,picturesque:1.6,pileup:-1.1,pique:-1.1,piqued:.1,piss:-1.7,pissant:-1.5,pissants:-2.5,pissed:-3.2,pisser:-2,pissers:-1.4,pisses:-1.4,pissing:-1.7,pissoir:-.8,piteous:-1.2,pitiable:-1.1,pitiableness:-1.1,pitiably:-1.1,pitied:-1.3,pitier:-1.2,pitiers:-1.3,pities:-1.2,pitiful:-2.2,pitifuller:-1.8,pitifullest:-1.1,pitifully:-1.2,pitifulness:-1.2,pitiless:-1.8,pitilessly:-2.1,pitilessness:-.5,pity:-1.2,pitying:-1.4,pityingly:-1,pityriasis:-.8,play:1.4,played:1.4,playful:1.9,playfully:1.6,playfulness:1.2,playing:.8,plays:1,pleasant:2.3,pleasanter:1.5,pleasantest:2.6,pleasantly:2.1,pleasantness:2.3,pleasantnesses:2.3,pleasantries:1.3,pleasantry:2,please:1.3,pleased:1.9,pleaser:1.7,pleasers:1,pleases:1.7,pleasing:2.4,pleasurability:1.9,pleasurable:2.4,pleasurableness:2.4,pleasurably:2.6,pleasure:2.7,pleasured:2.3,pleasureless:-1.6,pleasures:1.9,pleasuring:2.8,poised:1,poison:-2.5,poisoned:-2.2,poisoner:-2.7,poisoners:-3.1,poisoning:-2.8,poisonings:-2.4,poisonous:-2.7,poisonously:-2.9,poisons:-2.7,poisonwood:-1,pollute:-2.3,polluted:-2,polluter:-1.8,polluters:-2,pollutes:-2.2,poor:-2.1,poorer:-1.5,poorest:-2.5,popular:1.8,popularise:1.6,popularised:1.1,popularises:.5,popularising:1.2,popularities:1.6,popularity:2.1,popularization:1.3,popularizations:.9,popularize:1.3,popularized:1.9,popularizer:1.8,popularizers:1,popularizes:1.4,popularizing:1.5,popularly:1.8,positive:2.6,positively:2.4,positiveness:2.3,positivenesses:2.2,positiver:2.3,positives:2.4,positivest:2.9,positivism:1.6,positivisms:1.8,positivist:2,positivistic:1.9,positivists:1.7,positivities:2.6,positivity:2.3,possessive:-.9,postpone:-.9,postponed:-.8,postpones:-1.1,postponing:-.5,poverty:-2.3,powerful:1.8,powerless:-2.2,praise:2.6,praised:2.2,praiser:2,praisers:2,praises:2.4,praiseworthily:1.9,praiseworthiness:2.4,praiseworthy:2.6,praising:2.5,pray:1.3,praying:1.5,prays:1.4,prblm:-1.6,prblms:-2.3,precious:2.7,preciously:2.2,preciousness:1.9,prejudice:-2.3,prejudiced:-1.9,prejudices:-1.8,prejudicial:-2.6,prejudicially:-1.5,prejudicialness:-2.4,prejudicing:-1.8,prepared:.9,pressure:-1.2,pressured:-.9,pressureless:1,pressures:-1.3,pressuring:-1.4,pressurise:-.6,pressurised:-.4,pressurises:-.8,pressurising:-.6,pressurizations:-.3,pressurize:-.7,pressurized:.1,pressurizer:.1,pressurizers:-.7,pressurizes:-.2,pressurizing:-.2,pretend:-.4,pretending:.4,pretends:-.4,prettied:1.6,prettier:2.1,pretties:1.7,prettiest:2.7,pretty:2.2,prevent:.1,prevented:.1,preventing:-.1,prevents:.3,prick:-1.4,pricked:-.6,pricker:-.3,prickers:-.2,pricket:-.5,prickets:.3,pricking:-.9,prickle:-1,prickled:-.2,prickles:-.8,pricklier:-1.6,prickliest:-1.4,prickliness:-.6,prickling:-.8,prickly:-.9,pricks:-.9,pricky:-.6,pride:1.4,prison:-2.3,prisoner:-2.5,prisoners:-2.3,privilege:1.5,privileged:1.9,privileges:1.6,privileging:.7,prize:2.3,prized:2.4,prizefight:-.1,prizefighter:1,prizefighters:-.1,prizefighting:.4,prizefights:.3,prizer:1,prizers:.8,prizes:2,prizewinner:2.3,prizewinners:2.4,prizewinning:3,proactive:1.8,problem:-1.7,problematic:-1.9,problematical:-1.8,problematically:-2,problematics:-1.3,problems:-1.7,profit:1.9,profitabilities:1.1,profitability:1.1,profitable:1.9,profitableness:2.4,profitably:1.6,profited:1.3,profiteer:.8,profiteered:-.5,profiteering:-.6,profiteers:.5,profiter:.7,profiterole:.4,profiteroles:.5,profiting:1.6,profitless:-1.5,profits:1.9,profitwise:.9,progress:1.8,prominent:1.3,promiscuities:-.8,promiscuity:-1.8,promiscuous:-.3,promiscuously:-1.5,promiscuousness:-.9,promise:1.3,promised:1.5,promisee:.8,promisees:1.1,promiser:1.3,promisers:1.6,promises:1.6,promising:1.7,promisingly:1.2,promisor:1,promisors:.4,promissory:.9,promote:1.6,promoted:1.8,promotes:1.4,promoting:1.5,propaganda:-1,prosecute:-1.7,prosecuted:-1.6,prosecutes:-1.8,prosecution:-2.2,prospect:1.2,prospects:1.2,prosperous:2.1,protect:1.6,protected:1.9,protects:1.3,protest:-1,protested:-.5,protesters:-.9,protesting:-1.8,protests:-.9,proud:2.1,prouder:2.2,proudest:2.6,proudful:1.9,proudhearted:1.4,proudly:2.6,provoke:-1.7,provoked:-1.1,provokes:-1.3,provoking:-.8,pseudoscience:-1.2,puke:-2.4,puked:-1.8,pukes:-1.9,puking:-1.8,pukka:2.8,punish:-2.4,punishabilities:-1.7,punishability:-1.6,punishable:-1.9,punished:-2,punisher:-1.9,punishers:-2.6,punishes:-2.1,punishing:-2.6,punishment:-2.2,punishments:-1.8,punitive:-2.3,pushy:-1.1,puzzled:-.7,quaking:-1.5,questionable:-1.2,questioned:-.4,questioning:-.4,racism:-3.1,racist:-3,racists:-2.5,radian:.4,radiance:1.4,radiances:1.1,radiancies:.8,radiancy:1.4,radians:.2,radiant:2.1,radiantly:1.3,radiants:1.2,rage:-2.6,raged:-2,ragee:-.4,rageful:-2.8,rages:-2.1,raging:-2.4,rainy:-.3,rancid:-2.5,rancidity:-2.6,rancidly:-2.5,rancidness:-2.6,rancidnesses:-1.6,rant:-1.4,ranter:-1.2,ranters:-1.2,rants:-1.3,rape:-3.7,raped:-3.6,raper:-3.4,rapers:-3.6,rapes:-3.5,rapeseeds:-.5,raping:-3.8,rapist:-3.9,rapists:-3.3,rapture:.6,raptured:.9,raptures:.7,rapturous:1.7,rash:-1.7,ratified:.6,reach:.1,reached:.4,reaches:.2,reaching:.8,readiness:1,ready:1.5,reassurance:1.5,reassurances:1.4,reassure:1.4,reassured:1.7,reassures:1.5,reassuring:1.7,reassuringly:1.8,rebel:-.6,rebeldom:-1.5,rebelled:-1,rebelling:-1.1,rebellion:-.5,rebellions:-1.1,rebellious:-1.2,rebelliously:-1.8,rebelliousness:-1.2,rebels:-.8,recession:-1.8,reckless:-1.7,recommend:1.5,recommended:.8,recommends:.9,redeemed:1.3,reek:-2.4,reeked:-2,reeker:-1.7,reekers:-1.5,reeking:-2,refuse:-1.2,refused:-1.2,refusing:-1.7,regret:-1.8,regretful:-1.9,regretfully:-1.9,regretfulness:-1.6,regrets:-1.5,regrettable:-2.3,regrettably:-2,regretted:-1.6,regretter:-1.6,regretters:-2,regretting:-1.7,reinvigorate:2.3,reinvigorated:1.9,reinvigorates:1.8,reinvigorating:1.7,reinvigoration:2.2,reject:-1.7,rejected:-2.3,rejectee:-2.3,rejectees:-1.8,rejecter:-1.6,rejecters:-1.8,rejecting:-2,rejectingly:-1.7,rejection:-2.5,rejections:-2.1,rejective:-1.8,rejector:-1.8,rejects:-2.2,rejoice:1.9,rejoiced:2,rejoices:2.1,rejoicing:2.8,relax:1.9,relaxant:1,relaxants:.7,relaxation:2.4,relaxations:1,relaxed:2.2,relaxedly:1.5,relaxedness:2,relaxer:1.6,relaxers:1.4,relaxes:1.5,relaxin:1.7,relaxing:2.2,relaxins:1.2,relentless:.2,reliant:.5,relief:2.1,reliefs:1.3,relievable:1.1,relieve:1.5,relieved:1.6,relievedly:1.4,reliever:1.5,relievers:1,relieves:1.5,relieving:1.5,relievo:1.3,relishing:1.6,reluctance:-1.4,reluctancy:-1.6,reluctant:-1,reluctantly:-.4,remarkable:2.6,remorse:-1.1,remorseful:-.9,remorsefully:-.7,remorsefulness:-.7,remorseless:-2.3,remorselessly:-2,remorselessness:-2.8,repetitive:-1,repress:-1.4,repressed:-1.3,represses:-1.3,repressible:-1.5,repressing:-1.8,repression:-1.6,repressions:-1.7,repressive:-1.4,repressively:-1.7,repressiveness:-1,repressor:-1.4,repressors:-2.2,repressurize:-.3,repressurized:.1,repressurizes:.1,repressurizing:-.1,repulse:-2.8,repulsed:-2.2,rescue:2.3,rescued:1.8,rescues:1.3,resent:-.7,resented:-1.6,resentence:-1,resentenced:-.8,resentences:-.6,resentencing:.2,resentful:-2.1,resentfully:-1.4,resentfulness:-2,resenting:-1.2,resentment:-1.9,resentments:-1.9,resents:-1.2,resign:-1.4,resignation:-1.2,resignations:-1.2,resigned:-1,resignedly:-.7,resignedness:-.8,resigner:-1.2,resigners:-1,resigning:-.9,resigns:-1.3,resolute:1.1,resolvable:1,resolve:1.6,resolved:.7,resolvent:.7,resolvents:.4,resolver:.7,resolvers:1.4,resolves:.7,resolving:1.6,respect:2.1,respectabilities:1.8,respectability:2.4,respectable:1.9,respectableness:1.2,respectably:1.7,respected:2.1,respecter:2.1,respecters:1.6,respectful:2,respectfully:1.7,respectfulness:1.9,respectfulnesses:1.3,respecting:2.2,respective:1.8,respectively:1.4,respectiveness:1.1,respects:1.3,responsible:1.3,responsive:1.5,restful:1.5,restless:-1.1,restlessly:-1.4,restlessness:-1.2,restore:1.2,restored:1.4,restores:1.2,restoring:1.2,restrict:-1.6,restricted:-1.6,restricting:-1.6,restriction:-1.1,restricts:-1.3,retained:.1,retard:-2.4,retarded:-2.7,retreat:.8,revenge:-2.4,revenged:-.9,revengeful:-2.4,revengefully:-1.4,revengefulness:-2.2,revenger:-2.1,revengers:-2,revenges:-1.9,revered:2.3,revive:1.4,revives:1.6,reward:2.7,rewardable:2,rewarded:2.2,rewarder:1.6,rewarders:1.9,rewarding:2.4,rewardingly:2.4,rewards:2.1,rich:2.6,richened:1.9,richening:1,richens:.8,richer:2.4,riches:2.4,richest:2.4,richly:1.9,richness:2.2,richnesses:2.1,richweed:.1,richweeds:-.1,ridicule:-2,ridiculed:-1.5,ridiculer:-1.6,ridiculers:-1.6,ridicules:-1.8,ridiculing:-1.8,ridiculous:-1.5,ridiculously:-1.4,ridiculousness:-1.1,ridiculousnesses:-1.6,rig:-.5,rigged:-1.5,rigid:-.5,rigidification:-1.1,rigidifications:-.8,rigidified:-.7,rigidifies:-.6,rigidify:-.3,rigidities:-.7,rigidity:-.7,rigidly:-.7,rigidness:-.3,rigorous:-1.1,rigorously:-.4,riot:-2.6,riots:-2.3,risk:-1.1,risked:-.9,risker:-.8,riskier:-1.4,riskiest:-1.5,riskily:-.7,riskiness:-1.3,riskinesses:-1.6,risking:-1.3,riskless:1.3,risks:-1.1,risky:-.8,rob:-2.6,robber:-2.6,robed:-.7,robing:-1.5,robs:-2,robust:1.4,roflcopter:2.1,romance:2.6,romanced:2.2,romancer:1.3,romancers:1.7,romances:1.3,romancing:2,romantic:1.7,romantically:1.8,romanticise:1.7,romanticised:1.7,romanticises:1.3,romanticising:2.7,romanticism:2.2,romanticisms:2.1,romanticist:1.9,romanticists:1.3,romanticization:1.5,romanticizations:2,romanticize:1.8,romanticized:.9,romanticizes:1.8,romanticizing:1.2,romantics:1.9,rotten:-2.3,rude:-2,rudely:-2.2,rudeness:-1.5,ruder:-2.1,ruderal:-.8,ruderals:-.4,rudesby:-2,rudest:-2.5,ruin:-2.8,ruinable:-1.6,ruinate:-2.8,ruinated:-1.5,ruinates:-1.5,ruinating:-1.5,ruination:-2.7,ruinations:-1.6,ruined:-2.1,ruiner:-2,ruing:-1.6,ruining:-1,ruinous:-2.7,ruinously:-2.6,ruinousness:-1,ruins:-1.9,sabotage:-2.4,sad:-2.1,sadden:-2.6,saddened:-2.4,saddening:-2.2,saddens:-1.9,sadder:-2.4,saddest:-3,sadly:-1.8,sadness:-1.9,safe:1.9,safecracker:-.7,safecrackers:-.9,safecracking:-.9,safecrackings:-.7,safeguard:1.6,safeguarded:1.5,safeguarding:1.1,safeguards:1.4,safekeeping:1.4,safelight:1.1,safelights:.8,safely:2.2,safeness:1.5,safer:1.8,safes:.4,safest:1.7,safeties:1.5,safety:1.8,safetyman:.3,salient:1.1,sappy:-1,sarcasm:-.9,sarcasms:-.9,sarcastic:-1,sarcastically:-1.1,satisfaction:1.9,satisfactions:2.1,satisfactorily:1.6,satisfactoriness:1.5,satisfactory:1.5,satisfiable:1.9,satisfied:1.8,satisfies:1.8,satisfy:2,satisfying:2,satisfyingly:1.9,savage:-2,savaged:-2,savagely:-2.2,savageness:-2.6,savagenesses:-.9,savageries:-1.9,savagery:-2.5,savages:-2.4,save:2.2,saved:1.8,scam:-2.7,scams:-2.8,scandal:-1.9,scandalous:-2.4,scandals:-2.2,scapegoat:-1.7,scapegoats:-1.4,scare:-2.2,scarecrow:-.8,scarecrows:-.7,scared:-1.9,scaremonger:-2.1,scaremongers:-2,scarer:-1.7,scarers:-1.3,scares:-1.4,scarey:-1.7,scaring:-1.9,scary:-2.2,sceptic:-1,sceptical:-1.2,scepticism:-.8,sceptics:-.7,scold:-1.7,scoop:.6,scorn:-1.7,scornful:-1.8,scream:-1.7,screamed:-1.3,screamers:-1.5,screaming:-1.6,screams:-1.2,screw:-.4,screwball:-.2,screwballs:-.3,screwbean:.3,screwdriver:.3,screwdrivers:.1,screwed:-2.2,"screwed up":-1.5,screwer:-1.2,screwers:-.5,screwier:-.6,screwiest:-2,screwiness:-.5,screwing:-.9,screwlike:.1,screws:-1,screwup:-1.7,screwups:-1,screwworm:-.4,screwworms:-.1,screwy:-1.4,scrumptious:2.1,scrumptiously:1.5,scumbag:-3.2,secure:1.4,secured:1.7,securely:1.4,securement:1.1,secureness:1.4,securer:1.5,securers:.6,secures:1.3,securest:2.6,securing:1.3,securities:1.2,securitization:.2,securitizations:.1,securitize:.3,securitized:1.4,securitizes:1.6,securitizing:.7,security:1.4,sedition:-1.8,seditious:-1.7,seduced:-1.5,"self-confident":2.5,selfish:-2.1,selfishly:-1.4,selfishness:-1.7,selfishnesses:-2,sentence:.3,sentenced:-.1,sentences:.2,sentencing:-.6,sentimental:1.3,sentimentalise:1.2,sentimentalised:.8,sentimentalising:.4,sentimentalism:1,sentimentalisms:.4,sentimentalist:.8,sentimentalists:.7,sentimentalities:.9,sentimentality:1.2,sentimentalization:1.2,sentimentalizations:.4,sentimentalize:.8,sentimentalized:1.1,sentimentalizes:1.1,sentimentalizing:.8,sentimentally:1.9,serene:2,serious:-.3,seriously:-.7,seriousness:-.2,severe:-1.6,severed:-1.5,severely:-2,severeness:-1,severer:-1.6,severest:-1.5,sexy:2.4,shake:-.7,shakeable:-.3,shakedown:-1.2,shakedowns:-1.4,shaken:-.3,shakeout:-1.3,shakeouts:-.8,shakers:.3,shakeup:-.6,shakeups:-.5,shakier:-.9,shakiest:-1.2,shakily:-.7,shakiness:-.7,shaking:-.7,shaky:-.9,shame:-2.1,shamed:-2.6,shamefaced:-2.3,shamefacedly:-1.9,shamefacedness:-2,shamefast:-1,shameful:-2.2,shamefully:-1.9,shamefulness:-2.4,shamefulnesses:-2.3,shameless:-1.4,shamelessly:-1.4,shamelessness:-1.4,shamelessnesses:-2,shames:-1.7,share:1.2,shared:1.4,shares:1.2,sharing:1.8,shattered:-2.1,shit:-2.6,shitake:-.3,shitakes:-1.1,shithead:-3.1,shitheads:-2.6,shits:-2.1,shittah:.1,shitted:-1.7,shittier:-2.1,shittiest:-3.4,shittim:-.6,shittimwood:-.3,shitting:-1.8,shitty:-2.6,shock:-1.6,shockable:-1,shocked:-1.3,shocker:-.6,shockers:-1.1,shocking:-1.7,shockingly:-.7,shockproof:1.3,shocks:-1.6,shook:-.4,shoot:-1.4,"short-sighted":-1.2,"short-sightedness":-1.1,shortage:-1,shortages:-.6,shrew:-.9,shy:-1,shyer:-.8,shying:-.9,shylock:-2.1,shylocked:-.7,shylocking:-1.5,shylocks:-1.4,shyly:-.7,shyness:-1.3,shynesses:-1.2,shyster:-1.6,shysters:-.9,sick:-2.3,sicken:-1.9,sickened:-2.5,sickener:-2.2,sickeners:-2.2,sickening:-2.4,sickeningly:-2.1,sickens:-2,sigh:.1,significance:1.1,significant:.8,silencing:-.5,sillibub:-.1,sillier:1,sillies:.8,silliest:.8,sillily:-.1,sillimanite:.1,sillimanites:.2,silliness:-.9,sillinesses:-1.2,silly:.1,sin:-2.6,sincere:1.7,sincerely:2.1,sincereness:1.8,sincerer:2,sincerest:2,sincerities:1.5,sinful:-2.6,singleminded:1.2,sinister:-2.9,sins:-2,skeptic:-.9,skeptical:-1.3,skeptically:-1.2,skepticism:-1,skepticisms:-1.2,skeptics:-.4,slam:-1.6,slash:-1.1,slashed:-.9,slashes:-.8,slashing:-1.1,slavery:-3.8,sleeplessness:-1.6,slicker:.4,slickest:.3,sluggish:-1.7,slut:-2.8,sluts:-2.7,sluttier:-2.7,sluttiest:-3.1,sluttish:-2.2,sluttishly:-2.1,sluttishness:-2.5,sluttishnesses:-2,slutty:-2.3,smart:1.7,smartass:-2.1,smartasses:-1.7,smarted:.7,smarten:1.9,smartened:1.5,smartening:1.7,smartens:1.5,smarter:2,smartest:3,smartie:1.3,smarties:1.7,smarting:-.7,smartly:1.5,smartness:2,smartnesses:1.5,smarts:1.6,smartweed:.2,smartweeds:.1,smarty:1.1,smear:-1.5,smilax:.6,smilaxes:.3,smile:1.5,smiled:2.5,smileless:-1.4,smiler:1.7,smiles:2.1,smiley:1.7,smileys:1.5,smiling:2,smilingly:2.3,smog:-1.2,smother:-1.8,smothered:-.9,smothering:-1.4,smothers:-1.9,smothery:-1.1,smug:.8,smugger:-1,smuggest:-1.5,smuggle:-1.6,smuggled:-1.5,smuggler:-2.1,smugglers:-1.4,smuggles:-1.7,smuggling:-2.1,smugly:.2,smugness:-1.4,smugnesses:-1.7,sneaky:-.9,snob:-2,snobbery:-2,snobbier:-.7,snobbiest:-.5,snobbily:-1.6,snobbish:-.9,snobbishly:-1.2,snobbishness:-1.1,snobbishnesses:-1.7,snobbism:-1,snobbisms:-.3,snobby:-1.7,snobs:-1.4,snub:-1.8,snubbed:-2,snubbing:-.9,snubs:-2.1,sob:-1,sobbed:-1.9,sobbing:-1.6,sobering:-.8,sobs:-2.5,sociabilities:1.2,sociability:1.1,sociable:1.9,sociableness:1.5,sociably:1.6,sok:1.3,solemn:-.3,solemnified:-.5,solemnifies:-.5,solemnify:.3,solemnifying:.1,solemnities:.3,solemnity:-1.1,solemnization:.7,solemnize:.3,solemnized:-.7,solemnizes:.6,solemnizing:-.6,solemnly:.8,solid:.6,solidarity:1.2,solution:1.3,solutions:.7,solve:.8,solved:1.1,solves:1.1,solving:1.4,somber:-1.8,"son-of-a-bitch":-2.7,soothe:1.5,soothed:.5,soothing:1.3,sophisticated:2.6,sore:-1.5,sorrow:-2.4,sorrowed:-2.4,sorrower:-2.3,sorrowful:-2.2,sorrowfully:-2.3,sorrowfulness:-2.5,sorrowing:-1.7,sorrows:-1.6,sorry:-.3,soulmate:2.9,spam:-1.5,spammer:-2.2,spammers:-1.6,spamming:-2.1,spark:.9,sparkle:1.8,sparkles:1.3,sparkling:1.2,special:1.7,speculative:.4,spirit:.7,spirited:1.3,spiritless:-1.3,spite:-2.4,spited:-2.4,spiteful:-1.9,spitefully:-2.3,spitefulness:-1.5,spitefulnesses:-2.3,spites:-1.4,splendent:2.7,splendid:2.8,splendidly:2.1,splendidness:2.3,splendiferous:2.6,splendiferously:1.9,splendiferousness:1.7,splendor:3,splendorous:2.2,splendors:2,splendour:2.2,splendours:2.2,splendrous:2.2,sprightly:2,squelched:-1,stab:-2.8,stabbed:-1.9,stable:1.2,stabs:-1.9,stall:-.8,stalled:-.8,stalling:-.8,stamina:1.2,stammer:-.9,stammered:-.9,stammerer:-1.1,stammerers:-.8,stammering:-1,stammers:-.8,stampede:-1.8,stank:-1.9,startle:-1.3,startled:-.7,startlement:-.5,startlements:.2,startler:-.8,startlers:-.5,startles:-.5,startling:.3,startlingly:-.3,starve:-1.9,starved:-2.6,starves:-2.3,starving:-1.8,steadfast:1,steal:-2.2,stealable:-1.7,stealer:-1.7,stealers:-2.2,stealing:-2.7,stealings:-1.9,steals:-2.3,stealth:-.3,stealthier:-.3,stealthiest:.4,stealthily:.1,stealthiness:.2,stealths:-.3,stealthy:-.1,stench:-2.3,stenches:-1.5,stenchful:-2.4,stenchy:-2.3,stereotype:-1.3,stereotyped:-1.2,stifled:-1.4,stimulate:.9,stimulated:.9,stimulates:1,stimulating:1.9,stingy:-1.6,stink:-1.7,stinkard:-2.3,stinkards:-1,stinkbug:-.2,stinkbugs:-1,stinker:-1.5,stinkers:-1.2,stinkhorn:-.2,stinkhorns:-.8,stinkier:-1.5,stinkiest:-2.1,stinking:-2.4,stinkingly:-1.3,stinko:-1.5,stinkpot:-2.5,stinkpots:-.7,stinks:-1,stinkweed:-.4,stinkwood:-.1,stinky:-1.5,stolen:-2.2,stop:-1.2,stopped:-.9,stopping:-.6,stops:-.6,stout:.7,straight:.9,strain:-.2,strained:-1.7,strainer:-.8,strainers:-.3,straining:-1.3,strains:-1.2,strange:-.8,strangely:-1.2,strangled:-2.5,strength:2.2,strengthen:1.3,strengthened:1.8,strengthener:1.8,strengtheners:1.4,strengthening:2.2,strengthens:2,strengths:1.7,stress:-1.8,stressed:-1.4,stresses:-2,stressful:-2.3,stressfully:-2.6,stressing:-1.5,stressless:1.6,stresslessness:1.6,stressor:-1.8,stressors:-2.1,stricken:-2.3,strike:-.5,strikers:-.6,strikes:-1.5,strong:2.3,strongbox:.7,strongboxes:.3,stronger:1.6,strongest:1.9,stronghold:.5,strongholds:1,strongish:1.7,strongly:1.1,strongman:.7,strongmen:.5,strongyl:.6,strongyles:.2,strongyloidosis:-.8,strongyls:.1,struck:-1,struggle:-1.3,struggled:-1.4,struggler:-1.1,strugglers:-1.4,struggles:-1.5,struggling:-1.8,stubborn:-1.7,stubborner:-1.5,stubbornest:-.6,stubbornly:-1.4,stubbornness:-1.1,stubbornnesses:-1.5,stuck:-1,stunk:-1.6,stunned:-.4,stunning:1.6,stuns:.1,stupid:-2.4,stupider:-2.5,stupidest:-2.4,stupidities:-2,stupidity:-1.9,stupidly:-2,stupidness:-1.7,stupidnesses:-2.6,stupids:-2.3,stutter:-1,stuttered:-.9,stutterer:-1,stutterers:-1.1,stuttering:-1.3,stutters:-1,suave:2,submissive:-1.3,submissively:-1,submissiveness:-.7,substantial:.8,subversive:-.9,succeed:2.2,succeeded:1.8,succeeder:1.2,succeeders:1.3,succeeding:2.2,succeeds:2.2,success:2.7,successes:2.6,successful:2.8,successfully:2.2,successfulness:2.7,succession:.8,successional:.9,successionally:1.1,successions:.1,successive:1.1,successively:.9,successiveness:1,successor:.9,successors:1.1,suck:-1.9,sucked:-2,sucker:-2.4,suckered:-2,suckering:-2.1,suckers:-2.3,sucks:-1.5,sucky:-1.9,suffer:-2.5,suffered:-2.2,sufferer:-2,sufferers:-2.4,suffering:-2.1,suffers:-2.1,suicidal:-3.5,suicide:-3.5,suing:-1.1,sulking:-1.5,sulky:-.8,sullen:-1.7,sunnier:2.3,sunniest:2.4,sunny:1.8,sunshine:2.2,sunshiny:1.9,super:2.9,superb:3.1,superior:2.5,superiorities:.8,superiority:1.4,superiorly:2.2,superiors:1,support:1.7,supported:1.3,supporter:1.1,supporters:1.9,supporting:1.9,supportive:1.2,supportiveness:1.5,supports:1.5,supremacies:.8,supremacist:.5,supremacists:-1,supremacy:.2,suprematists:.4,supreme:2.6,supremely:2.7,supremeness:2.3,supremer:2.3,supremest:2.2,supremo:1.9,supremos:1.3,sure:1.3,surefire:1,surefooted:1.9,surefootedly:1.6,surefootedness:1.5,surely:1.9,sureness:2,surer:1.2,surest:1.3,sureties:1.3,surety:1,suretyship:-.1,suretyships:.4,surprisal:1.5,surprisals:.7,surprise:1.1,surprised:.9,surpriser:.6,surprisers:.3,surprises:.9,surprising:1.1,surprisingly:1.2,survived:2.3,surviving:1.2,survivor:1.5,suspect:-1.2,suspected:-.9,suspecting:-.7,suspects:-1.4,suspend:-1.3,suspended:-2.1,suspicion:-1.6,suspicions:-1.5,suspicious:-1.5,suspiciously:-1.7,suspiciousness:-1.2,sux:-1.5,swear:-.2,swearing:-1,swears:.2,sweet:2,"sweet<3":3,sweetheart:3.3,sweethearts:2.8,sweetie:2.2,sweeties:2.1,sweetly:2.1,sweetness:2.2,sweets:2.2,swift:.8,swiftly:1.2,swindle:-2.4,swindles:-1.5,swindling:-2,sympathetic:2.3,sympathy:1.5,talent:1.8,talented:2.3,talentless:-1.6,talents:2,tantrum:-1.8,tantrums:-1.5,tard:-2.5,tears:-.9,teas:.3,tease:-1.3,teased:-1.2,teasel:-.1,teaseled:-.8,teaseler:-.8,teaselers:-1.2,teaseling:-.4,teaselled:-.4,teaselling:-.2,teasels:-.1,teaser:-1,teasers:-.7,teases:-1.2,teashops:.2,teasing:-.3,teasingly:-.4,teaspoon:.2,teaspoonful:.2,teaspoonfuls:.4,teaspoons:.5,teaspoonsful:.3,temper:-1.8,tempers:-1.3,tendered:.5,tenderer:.6,tenderers:1.2,tenderest:1.4,tenderfeet:-.4,tenderfoot:-.1,tenderfoots:-.5,tenderhearted:1.5,tenderheartedly:2.7,tenderheartedness:.7,tenderheartednesses:2.8,tendering:.6,tenderization:.2,tenderize:.1,tenderized:.1,tenderizer:.4,tenderizes:.3,tenderizing:.3,tenderloin:-.2,tenderloins:.4,tenderly:1.8,tenderness:1.8,tendernesses:.9,tenderometer:.2,tenderometers:.2,tenders:.6,tense:-1.4,tensed:-1,tensely:-1.2,tenseness:-1.5,tenser:-1.5,tenses:-.9,tensest:-1.2,tensing:-1,tension:-1.3,tensional:-.8,tensioned:-.4,tensioner:-1.6,tensioners:-.9,tensioning:-1.4,tensionless:.6,tensions:-1.7,terrible:-2.1,terribleness:-1.9,terriblenesses:-2.6,terribly:-2.6,terrific:2.1,terrifically:1.7,terrified:-3,terrifies:-2.6,terrify:-2.3,terrifying:-2.7,terror:-2.4,terrorise:-3.1,terrorised:-3.3,terrorises:-3.3,terrorising:-3,terrorism:-3.6,terrorisms:-3.2,terrorist:-3.7,terroristic:-3.3,terrorists:-3.1,terrorization:-2.7,terrorize:-3.3,terrorized:-3.1,terrorizes:-3.1,terrorizing:-3,terrorless:.9,terrors:-2.6,thank:1.5,thanked:1.9,thankful:2.7,thankfuller:1.9,thankfullest:2,thankfully:1.8,thankfulness:2.1,thanks:1.9,thief:-2.4,thieve:-2.2,thieved:-1.4,thieveries:-2.1,thievery:-2,thieves:-2.3,thorny:-1.1,thoughtful:1.6,thoughtfully:1.7,thoughtfulness:1.9,thoughtless:-2,threat:-2.4,threaten:-1.6,threatened:-2,threatener:-1.4,threateners:-1.8,threatening:-2.4,threateningly:-2.2,threatens:-1.6,threating:-2,threats:-1.8,thrill:1.5,thrilled:1.9,thriller:.4,thrillers:.1,thrilling:2.1,thrillingly:2,thrills:1.5,thwarted:-.1,thwarting:-.7,thwarts:-.4,ticked:-1.8,timid:-1,timider:-1,timidest:-.9,timidities:-.7,timidity:-1.3,timidly:-.7,timidness:-1,timorous:-.8,tired:-1.9,tits:-.9,tolerance:1.2,tolerances:.3,tolerant:1.1,tolerantly:.4,toothless:-1.4,top:.8,tops:2.3,torn:-1,torture:-2.9,tortured:-2.6,torturer:-2.3,torturers:-3.5,tortures:-2.5,torturing:-3,torturous:-2.7,torturously:-2.2,totalitarian:-2.1,totalitarianism:-2.7,tough:-.5,toughed:.7,toughen:.1,toughened:.1,toughening:.9,toughens:-.2,tougher:.7,toughest:-.3,toughie:-.7,toughies:-.6,toughing:-.5,toughish:-1,toughly:-1.1,toughness:-.2,toughnesses:.3,toughs:-.8,toughy:-.5,tout:-.5,touted:-.2,touting:-.7,touts:-.1,tragedian:-.5,tragedians:-1,tragedienne:-.4,tragediennes:-1.4,tragedies:-1.9,tragedy:-3.4,tragic:-2,tragical:-2.4,tragically:-2.7,tragicomedy:.2,tragicomic:-.2,tragics:-2.2,tranquil:.2,tranquiler:1.9,tranquilest:1.6,tranquilities:1.5,tranquility:1.8,tranquilize:.3,tranquilized:-.2,tranquilizer:-.1,tranquilizers:-.4,tranquilizes:-.1,tranquilizing:-.5,tranquillest:.8,tranquillities:.5,tranquillity:1.8,tranquillized:-.2,tranquillizer:-.1,tranquillizers:-.2,tranquillizes:.1,tranquillizing:.8,tranquilly:1.2,tranquilness:1.5,trap:-1.3,trapped:-2.4,trauma:-1.8,traumas:-2.2,traumata:-1.7,traumatic:-2.7,traumatically:-2.8,traumatise:-2.8,traumatised:-2.4,traumatises:-2.2,traumatising:-1.9,traumatism:-2.4,traumatization:-3,traumatizations:-2.2,traumatize:-2.4,traumatized:-1.7,traumatizes:-1.4,traumatizing:-2.3,travesty:-2.7,treason:-1.9,treasonous:-2.7,treasurable:2.5,treasure:1.2,treasured:2.6,treasurer:.5,treasurers:.4,treasurership:.4,treasurerships:1.2,treasures:1.8,treasuries:.9,treasuring:2.1,treasury:.8,treat:1.7,tremble:-1.1,trembled:-1.1,trembler:-.6,tremblers:-1,trembles:-.1,trembling:-1.5,trembly:-1.2,tremulous:-1,trick:-.2,tricked:-.6,tricker:-.9,trickeries:-1.2,trickers:-1.4,trickery:-1.1,trickie:-.4,trickier:-.7,trickiest:-1.2,trickily:-.8,trickiness:-1.2,trickinesses:-.4,tricking:.1,trickish:-1,trickishly:-.7,trickishness:-.4,trickled:.1,trickledown:-.7,trickles:.2,trickling:-.2,trickly:-.3,tricks:-.5,tricksier:-.5,tricksiness:-1,trickster:-.9,tricksters:-1.3,tricksy:-.8,tricky:-.6,trite:-.8,triumph:2.1,triumphal:2,triumphalisms:1.9,triumphalist:.5,triumphalists:.9,triumphant:2.4,triumphantly:2.3,triumphed:2.2,triumphing:2.3,triumphs:2,trivial:-.1,trivialise:-.8,trivialised:-.8,trivialises:-1.1,trivialising:-1.4,trivialities:-1,triviality:-.5,trivialization:-.9,trivializations:-.7,trivialize:-1.1,trivialized:-.6,trivializes:-1,trivializing:-.6,trivially:.4,trivium:-.3,trouble:-1.7,troubled:-2,troublemaker:-2,troublemakers:-2.2,troublemaking:-1.8,troubler:-1.4,troublers:-1.9,troubles:-2,troubleshoot:.8,troubleshooter:1,troubleshooters:.8,troubleshooting:.7,troubleshoots:.5,troublesome:-2.3,troublesomely:-1.8,troublesomeness:-1.9,troubling:-2.5,troublous:-2.1,troublously:-2.1,trueness:2.1,truer:1.5,truest:1.9,truly:1.9,trust:2.3,trustability:2.1,trustable:2.3,trustbuster:-.5,trusted:2.1,trustee:1,trustees:.3,trusteeship:.5,trusteeships:.6,truster:1.9,trustful:2.1,trustfully:1.5,trustfulness:2.1,trustier:1.3,trusties:1,trustiest:2.2,trustily:1.6,trustiness:1.6,trusting:1.7,trustingly:1.6,trustingness:1.6,trustless:-2.3,trustor:.4,trustors:1.2,trusts:2.1,trustworthily:2.3,trustworthiness:1.8,trustworthy:2.6,trusty:2.2,truth:1.3,truthful:2,truthfully:1.9,truthfulness:1.7,truths:1.8,tumor:-1.6,turmoil:-1.5,twat:-3.4,ugh:-1.8,uglier:-2.2,uglies:-2,ugliest:-2.8,uglification:-2.2,uglified:-1.5,uglifies:-1.8,uglify:-2.1,uglifying:-2.2,uglily:-2.1,ugliness:-2.7,uglinesses:-2.5,ugly:-2.3,unacceptable:-2,unappreciated:-1.7,unapproved:-1.4,unattractive:-1.9,unaware:-.8,unbelievable:.8,unbelieving:-.8,unbiased:-.1,uncertain:-1.2,uncertainly:-1.4,uncertainness:-1.3,uncertainties:-1.4,uncertainty:-1.4,unclear:-1,uncomfortable:-1.6,uncomfortably:-1.7,uncompelling:-.9,unconcerned:-.9,unconfirmed:-.5,uncontrollability:-1.7,uncontrollable:-1.5,uncontrollably:-1.5,uncontrolled:-1,unconvinced:-1.6,uncredited:-1,undecided:-.9,underestimate:-1.2,underestimated:-1.1,underestimates:-1.1,undermine:-1.2,undermined:-1.5,undermines:-1.4,undermining:-1.5,undeserving:-1.9,undesirable:-1.9,unease:-1.7,uneasier:-1.4,uneasiest:-2.1,uneasily:-1.4,uneasiness:-1.6,uneasinesses:-1.8,uneasy:-1.6,unemployment:-1.9,unequal:-1.4,unequaled:.5,unethical:-2.3,unfair:-2.1,unfocused:-1.7,unfortunate:-2,unfortunately:-1.4,unfortunates:-1.9,unfriendly:-1.5,unfulfilled:-1.8,ungrateful:-2,ungratefully:-1.8,ungratefulness:-1.6,unhappier:-2.4,unhappiest:-2.5,unhappily:-1.9,unhappiness:-2.4,unhappinesses:-2.2,unhappy:-1.8,unhealthy:-2.4,unified:1.6,unimportant:-1.3,unimpressed:-1.4,unimpressive:-1.4,unintelligent:-2,uninvolved:-2.2,uninvolving:-2,united:1.8,unjust:-2.3,unkind:-1.6,unlovable:-2.7,unloved:-1.9,unlovelier:-1.9,unloveliest:-1.9,unloveliness:-2,unlovely:-2.1,unloving:-2.3,unmatched:-.3,unmotivated:-1.4,unpleasant:-2.1,unprofessional:-2.3,unprotected:-1.5,unresearched:-1.1,unsatisfied:-1.7,unsavory:-1.9,unsecured:-1.6,unsettled:-1.3,unsophisticated:-1.2,unstable:-1.5,unstoppable:-.8,unsuccessful:-1.5,unsuccessfully:-1.7,unsupported:-1.7,unsure:-1,unsurely:-1.3,untarnished:1.6,unwanted:-.9,unwelcome:-1.7,unworthy:-2,upset:-1.6,upsets:-1.5,upsetter:-1.9,upsetters:-2,upsetting:-2.1,uptight:-1.6,uptightness:-1.2,urgent:.8,useful:1.9,usefully:1.8,usefulness:1.2,useless:-1.8,uselessly:-1.5,uselessness:-1.6,"v.v":-2.9,vague:-.4,vain:-1.8,validate:1.5,validated:.9,validates:1.4,validating:1.4,valuable:2.1,valuableness:1.7,valuables:2.1,valuably:2.3,value:1.4,valued:1.9,values:1.7,valuing:1.4,vanity:-.9,verdict:.6,verdicts:.3,vested:.6,vexation:-1.9,vexing:-2,vibrant:2.4,vicious:-1.5,viciously:-1.3,viciousness:-2.4,viciousnesses:-.6,victim:-1.1,victimhood:-2,victimhoods:-.9,victimise:-1.1,victimised:-1.5,victimises:-1.2,victimising:-2.5,victimization:-2.3,victimizations:-1.5,victimize:-2.5,victimized:-1.8,victimizer:-1.8,victimizers:-1.6,victimizes:-1.5,victimizing:-2.6,victimless:.6,victimologies:-.6,victimologist:-.5,victimologists:-.4,victimology:.3,victims:-1.3,vigilant:.7,vigor:1.1,vigorish:-.4,vigorishes:.4,vigoroso:1.5,vigorously:.5,vigorousness:.4,vigors:1,vigour:.9,vigours:.4,vile:-3.1,villain:-2.6,villainess:-2.9,villainesses:-2,villainies:-2.3,villainous:-2,villainously:-2.9,villainousness:-2.7,villains:-3.4,villainy:-2.6,vindicate:.3,vindicated:1.8,vindicates:1.6,vindicating:-1.1,violate:-2.2,violated:-2.4,violater:-2.6,violaters:-2.4,violates:-2.3,violating:-2.5,violation:-2.2,violations:-2.4,violative:-2.4,violator:-2.4,violators:-1.9,violence:-3.1,violent:-2.9,violently:-2.8,virtue:1.8,virtueless:-1.4,virtues:1.5,virtuosa:1.7,virtuosas:1.8,virtuose:1,virtuosi:.9,virtuosic:2.2,virtuosity:2.1,virtuoso:2,virtuosos:1.8,virtuous:2.4,virtuously:1.8,virtuousness:2,virulent:-2.7,vision:1,visionary:2.4,visioning:1.1,visions:.9,vital:1.2,vitalise:1.1,vitalised:.6,vitalises:1.1,vitalising:2.1,vitalism:.2,vitalist:.3,vitalists:.3,vitalities:1.2,vitality:1.3,vitalization:1.6,vitalizations:.8,vitalize:1.6,vitalized:1.5,vitalizes:1.4,vitalizing:1.3,vitally:1.1,vitals:1.1,vitamin:1.2,vitriolic:-2.1,vivacious:1.8,vociferous:-.8,vulnerabilities:-.6,vulnerability:-.9,vulnerable:-.9,vulnerableness:-1.1,vulnerably:-1.2,vulture:-2,vultures:-1.3,w00t:2.2,walkout:-1.3,walkouts:-.7,wanker:-2.5,want:.3,war:-2.9,warfare:-1.2,warfares:-1.8,warm:.9,warmblooded:.2,warmed:1.1,warmer:1.2,warmers:1,warmest:1.7,warmhearted:1.8,warmheartedness:2.7,warming:.6,warmish:1.4,warmly:1.7,warmness:1.5,warmonger:-2.9,warmongering:-2.5,warmongers:-2.8,warmouth:.4,warmouths:-.8,warms:1.1,warmth:2,warmup:.4,warmups:.8,warn:-.4,warned:-1.1,warning:-1.4,warnings:-1.2,warns:-.4,warred:-2.4,warring:-1.9,wars:-2.6,warsaw:-.1,warsaws:-.2,warship:-.7,warships:-.5,warstle:.1,waste:-1.8,wasted:-2.2,wasting:-1.7,wavering:-.6,weak:-1.9,weaken:-1.8,weakened:-1.3,weakener:-1.6,weakeners:-1.3,weakening:-1.3,weakens:-1.3,weaker:-1.9,weakest:-2.3,weakfish:-.2,weakfishes:-.6,weakhearted:-1.6,weakish:-1.2,weaklier:-1.5,weakliest:-2.1,weakling:-1.3,weaklings:-1.4,weakly:-1.8,weakness:-1.8,weaknesses:-1.5,weakside:-1.1,wealth:2.2,wealthier:2.2,wealthiest:2.2,wealthily:2,wealthiness:2.4,wealthy:1.5,weapon:-1.2,weaponed:-1.4,weaponless:.1,weaponry:-.9,weapons:-1.9,weary:-1.1,weep:-2.7,weeper:-1.9,weepers:-1.1,weepie:-.4,weepier:-1.8,weepies:-1.6,weepiest:-2.4,weeping:-1.9,weepings:-1.9,weeps:-1.4,weepy:-1.3,weird:-.7,weirder:-.5,weirdest:-.9,weirdie:-1.3,weirdies:-1,weirdly:-1.2,weirdness:-.9,weirdnesses:-.7,weirdo:-1.8,weirdoes:-1.3,weirdos:-1.1,weirds:-.6,weirdy:-.9,welcome:2,welcomed:1.4,welcomely:1.9,welcomeness:2,welcomer:1.4,welcomers:1.9,welcomes:1.7,welcoming:1.9,well:1.1,welladay:.3,wellaway:-.8,wellborn:1.8,welldoer:2.5,welldoers:1.6,welled:.4,wellhead:.1,wellheads:.5,wellhole:-.1,wellies:.4,welling:1.6,wellness:1.9,wells:1,wellsite:.5,wellspring:1.5,wellsprings:1.4,welly:.2,wept:-2,whimsical:.3,whine:-1.5,whined:-.9,whiner:-1.2,whiners:-.6,whines:-1.8,whiney:-1.3,whining:-.9,whitewash:.1,whore:-3.3,whored:-2.8,whoredom:-2.1,whoredoms:-2.4,whorehouse:-1.1,whorehouses:-1.9,whoremaster:-1.9,whoremasters:-1.5,whoremonger:-2.6,whoremongers:-2,whores:-3,whoreson:-2.2,whoresons:-2.5,wicked:-2.4,wickeder:-2.2,wickedest:-2.9,wickedly:-2.1,wickedness:-2.1,wickednesses:-2.2,widowed:-2.1,willingness:1.1,wimp:-1.4,wimpier:-1,wimpiest:-.9,wimpiness:-1.2,wimpish:-1.6,wimpishness:-.2,wimple:-.2,wimples:-.3,wimps:-1,wimpy:-.9,win:2.8,winnable:1.8,winned:1.8,winner:2.8,winners:2.1,winning:2.4,winningly:2.3,winnings:2.5,winnow:-.3,winnower:-.1,winnowers:-.2,winnowing:-.1,winnows:-.2,wins:2.7,wisdom:2.4,wise:2.1,wiseacre:-1.2,wiseacres:-.1,wiseass:-1.8,wiseasses:-1.5,wisecrack:-.1,wisecracked:-.5,wisecracker:-.1,wisecrackers:.1,wisecracking:-.6,wisecracks:-.3,wised:1.5,wiseguys:.3,wiselier:.9,wiseliest:1.6,wisely:1.8,wiseness:1.9,wisenheimer:-1,wisenheimers:-1.4,wisents:.4,wiser:1.2,wises:1.3,wisest:2.1,wisewomen:1.3,wish:1.7,wishes:.6,wishing:.9,witch:-1.5,withdrawal:.1,woe:-1.8,woebegone:-2.6,woebegoneness:-1.1,woeful:-1.9,woefully:-1.7,woefulness:-2.1,woes:-1.9,woesome:-1.2,won:2.7,wonderful:2.7,wonderfully:2.9,wonderfulness:2.9,woo:2.1,woohoo:2.3,woot:1.8,worn:-1.2,worried:-1.2,worriedly:-2,worrier:-1.8,worriers:-1.7,worries:-1.8,worriment:-1.5,worriments:-1.9,worrisome:-1.7,worrisomely:-2,worrisomeness:-1.9,worrit:-2.1,worrits:-1.2,worry:-1.9,worrying:-1.4,worrywart:-1.8,worrywarts:-1.5,worse:-2.1,worsen:-2.3,worsened:-1.9,worsening:-2,worsens:-2.1,worser:-2,worship:1.2,worshiped:2.4,worshiper:1,worshipers:.9,worshipful:.7,worshipfully:1.1,worshipfulness:1.6,worshiping:1,worshipless:-.6,worshipped:2.7,worshipper:.6,worshippers:.8,worshipping:1.6,worships:1.4,worst:-3.1,worth:.9,worthless:-1.9,worthwhile:1.4,worthy:1.9,wow:2.8,wowed:2.6,wowing:2.5,wows:2,wowser:-1.1,wowsers:1,wrathful:-2.7,wreck:-1.9,wrong:-2.1,wronged:-1.9,"x-d":2.6,"x-p":1.7,xd:2.8,xp:1.6,yay:2.4,yeah:1.2,yearning:.5,yeees:1.7,yep:1.2,yes:1.7,youthful:1.3,yucky:-1.8,yummy:2.4,zealot:-1.9,zealots:-.8,zealous:.5,"{:":1.8,"|-0":-1.2,"|-:":-.8,"|-:>":-1.6,"|-o":-1.2,"|:":-.5,"|;-)":2.2,"|=":-.4,"|^:":-1.1,"|o:":-.9,"||-:":-2.3,"}:":-2.1,"}:(":-2,"}:)":.4,"}:-(":-2.1,"}:-)":.3}},function(e,s,i){"use strict";Object.defineProperty(s,"__esModule",{value:!0});var r=function(){function e(e,s){for(var i=0;i<s.length;i++){var r=s[i];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(s,i,r){return i&&e(s.prototype,i),r&&e(s,r),s}}();function t(e,s){if(!(e instanceof s))throw new TypeError("Cannot call a class as a function")}var n=i(0).lexicon,a=s.B_INCR=.293,l=s.B_DECR=-.293,o=s.C_INCR=.733,d=s.N_SCALAR=-.74,u=s.REGEX_REMOVE_PUNCTUATION=new RegExp(/[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/g),c=s.PUNC_LIST=[".","!","?",",",";",":","-","'",'"',"!!","!!!","??","???","?!?","!?!","?!?!","!?!?"],g=s.NEGATE=["aint","arent","cannot","cant","couldnt","darent","didnt","doesnt","ain't","aren't","can't","couldn't","daren't","didn't","doesn't","dont","hadnt","hasnt","havent","isnt","mightnt","mustnt","neither","don't","hadn't","hasn't","haven't","isn't","mightn't","mustn't","neednt","needn't","never","none","nope","nor","not","nothing","nowhere","oughtnt","shant","shouldnt","uhuh","wasnt","werent","oughtn't","shan't","shouldn't","uh-uh","wasn't","weren't","without","wont","wouldnt","won't","wouldn't","rarely","seldom","despite"],m=s.BOOSTER_DICT={absolutely:a,amazingly:a,awfully:a,completely:a,considerably:a,decidedly:a,deeply:a,effing:a,enormously:a,entirely:a,especially:a,exceptionally:a,extremely:a,fabulously:a,flipping:a,flippin:a,fricking:a,frickin:a,frigging:a,friggin:a,fully:a,fucking:a,greatly:a,hella:a,highly:a,hugely:a,incredibly:a,intensely:a,majorly:a,more:a,most:a,particularly:a,purely:a,quite:a,really:a,remarkably:a,so:a,substantially:a,thoroughly:a,totally:a,tremendously:a,uber:a,unbelievably:a,unusually:a,utterly:a,very:a,almost:l,barely:l,hardly:l,"just enough":l,"kind of":l,kinda:l,kindof:l,"kind-of":l,less:l,little:l,marginally:l,occasionally:l,partly:l,scarcely:l,slightly:l,somewhat:l,"sort of":l,sorta:l,sortof:l,"sort-of":l},p=s.SPECIAL_CASE_IDIOMS={"the shit":3,"the bomb":3,"bad ass":1.5,"yeah right":-2,"cut the mustard":2,"kiss of death":-1.5,"hand to mouth":-2},h=s.negated=function(e){var s=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],i=[];i.push.apply(i,g);for(var r=0;r<i.length;r++)if(e.indexOf(i[r])>=0)return!0;if(!0===s)for(var t=0;t<e.length;t++)if(e[t].indexOf("n't")>=0)return!0;var n=e.findIndex(function(e){return"least"===e});return-1!==n&&n>0&&"at"!==e[n-1]},f=s.normalize=function(e){var s=arguments.length>1&&void 0!==arguments[1]?arguments[1]:15,i=e/Math.sqrt(e*e+s);return i<-1?-1:i>1?1:i},y=s.allcap_differential=function(e){for(var s=0,i=0;i<e.length;i++)v(e[i])&&(s+=1);var r=e.length-s;return r>0&&r<e.length},b=s.scalar_inc_dec=function(e,s,i){var r=0,t=e.toLowerCase();return m.hasOwnProperty(t)&&(r=m[t],s<0&&(r*=-1),i&&v(e)&&(s>0?r+=o:r-=o)),r},v=s.is_upper_python=function(e){return("string"==typeof e||e instanceof String)&&e.length>0&&/^[^a-z]*[A-Z]+[^a-z]*$/g.test(e)},w=s.SentiText=function(){function e(s){t(this,e),this.text=s,this.words_and_emoticons=this.get_words_and_emoticons(),this.is_cap_diff=y(this.words_and_emoticons)}return r(e,[{key:"get_words_plus_punc",value:function(){for(var e=this.text.slice(0).replace(u,"").split(/\s/).filter(function(e){return e.length>1}),s={},i=0;i<c.length;i++)for(var r=0;r<e.length;r++){var t=""+c[i]+e[r],n=""+e[r]+c[i];s[t]=e[r],s[n]=e[r]}return s}},{key:"get_words_and_emoticons",value:function(){for(var e=this.text.split(/\s/),s=this.get_words_plus_punc(),i=e.filter(function(e){return e.length>1}),r=0;r<i.length;r++)s.hasOwnProperty(i[r])&&(i[r]=s[i[r]]);return i}}]),e}();s.SentimentIntensityAnalyzer=function(){function e(){t(this,e)}return r(e,null,[{key:"polarity_scores",value:function(s){for(var i=new w(s),r=[],t=i.words_and_emoticons,n=0;n<t.length;n++){var a=t[n];n<t.length-1&&"kind"===a.toLowerCase()&&"of"===t[n+1].toLowerCase()||m.hasOwnProperty(a.toLowerCase())?r.push(0):r=e.sentiment_valence(0,i,a,n,r)}return r=e.but_check(t,r),e.score_valence(r,s)}},{key:"sentiment_valence",value:function(e,s,i,r,t){var a=s.is_cap_diff,l=s.words_and_emoticons,d=i.toLowerCase();if(n.hasOwnProperty(d)){e=n[d],v(i)&&a&&(e>0?e+=o:e-=o);for(var u=0;u<3;u++)if(r>u&&!1===n.hasOwnProperty(l[r-(u+1)].toLowerCase())){var c=b(l[r-(u+1)],e,a);1===u&&0!==c?c*=.95:2===u&&0!==c&&(c*=.9),e+=c,e=this.never_check(e,l,u,r),2===u&&(e=this.idioms_check(e,l,r))}e=this.least_check(e,l,r)}return t.push(e),t}},{key:"least_check",value:function(e,s,i){return i>1&&"least"===s[i-1].toLowerCase()&&!1===n.hasOwnProperty(s[i-1].toLowerCase())?"at"!==s[i-2].toLowerCase()&&"very"!==s[i-2].toLowerCase()&&(e*=d):i>0&&"least"===s[i-1].toLowerCase()&&!1===n.hasOwnProperty(s[i-1].toLowerCase())&&(e*=d),e}},{key:"but_check",value:function(e,s){var i=e.indexOf("but");if(-1===i&&(i=e.indexOf("BUT")),-1!==i)for(var r=0;r<s.length;r++){var t=r,n=s[t];t<i?(s.splice(t,1),s.splice(t,0,.5*n)):t>i&&(s.splice(t,1),s.splice(t,0,1.5*n))}return s}},{key:"idioms_check",value:function(e,s,i){for(var r=s[i-1]+" "+s[i],t=s[i-2]+" "+s[i-1]+" "+s[i],n=s[i-2]+" "+s[i-1],a=s[i-3]+" "+s[i-2]+" "+s[i-1],o=s[i-3]+" "+s[i-2],d=[r,t,n,a,o],u=0;u<d.length;u++)if(p.hasOwnProperty(d[u])){e=p[d[u]];break}if(s.length-1>i){var c=s[i]+" "+s[i+1];p.hasOwnProperty(c)&&(e=p[c])}if(s.length-1>i+1){var g=s[i]+" "+s[i+1]+" "+s[i+2];p.hasOwnProperty(g)&&(e=p[g])}return(m.hasOwnProperty(o)||m.hasOwnProperty(n))&&(e+=l),e}},{key:"never_check",value:function(e,s,i,r){return 0===i&&h([s[r-1]])&&(e*=d),1===i&&("never"!==s[r-2]||"so"!==s[r-1]&&"this"!==s[r-1]?h([s[r-(i+1)]])&&(e*=d):e*=1.5),2===i&&("never"===s[r-3]&&("so"===s[r-2]||"this"===s[r-2])||"so"===s[r-1]||"this"===s[r-1]?e*=1.25:h([s[r-(i+1)]])&&(e*=d)),e}},{key:"punctuation_emphasis",value:function(s,i){return e.amplify_ep(i)+e.amplify_qm(i)}},{key:"amplify_ep",value:function(e){var s=e.replace(/[^!]/g,"").length;return s>4&&(s=4),.292*s}},{key:"amplify_qm",value:function(e){var s=e.replace(/[^?]/g,"").length,i=0;return s>1&&(i=s<=3?.18*s:.96),i}},{key:"sift_sentiment_scores",value:function(e){for(var s=0,i=0,r=0,t=0;t<e.length;t++){var n=e[t];n>0?s+=n+1:n<0?i+=n-1:r+=1}return[s,i,r]}},{key:"score_valence",value:function(s,i){if(s&&s.length>0){for(var r=0,t=0;t<s.length;t++)r+=s[t];var n=e.punctuation_emphasis(r,i);r>0?r+=n:r<0&&(r-=n);var a=f(r),l=e.sift_sentiment_scores(s),o=l[0],d=l[1],u=l[2];o>Math.abs(d)?o+=n:o<Math.abs(d)&&(d-=n);var c=o+Math.abs(d)+u,g=Math.abs(o/c),m=Math.abs(d/c),p=Math.abs(u/c);return{neg:parseFloat(m.toFixed(3)),neu:parseFloat(p.toFixed(3)),pos:parseFloat(g.toFixed(3)),compound:parseFloat(a.toFixed(4))}}return{neg:0,neu:0,pos:0,compound:0}}}]),e}()},function(e,s,i){"use strict";Object.defineProperty(s,"__esModule",{value:!0});var r=i(1);s.default=r.SentimentIntensityAnalyzer}]).default;
},{}]},{},[2]);
