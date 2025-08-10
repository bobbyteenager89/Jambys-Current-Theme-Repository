// Shared utilities for Proteus experiments
// Loaded only when the "Enable Proteus experiments" theme setting is active.
"use strict";

console.log("init Proteus utils - v1.05");

let variation;

const init_experiment = (exp_id, iteration = "0.01", force_variation) => {
  let exp_handle = exp_id.replace("-", "").toLowerCase();
  variation = window.window.sessionStorage.getItem(exp_id);

  if (getParam("qa").indexOf(exp_handle) > -1) {
    variation = getParam("qa").replace(exp_handle, "");
  }

  if (force_variation) {
    variation = force_variation;
  }

  let exp_tag = exp_handle + variation;
  document.documentElement.classList.add(exp_tag);
  console.log(`init ${exp_id}${variation} -- ${iteration}`);

  return variation;
};

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

function waitForElement(selector) {
  return new Promise(function (resolve, reject) {
    var element = document.querySelector(selector);

    if (element) {
      resolve(element);
      return;
    }

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        var nodes = Array.from(mutation.addedNodes);
        for (var node of nodes) {
          if (node.matches && node.matches(selector)) {
            observer.disconnect();
            resolve(node);
            return;
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

// shim layer with setTimeout fallback
const requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 3000 / 60);
    }
  );
})();

function waitUntil(test) {
  return new Promise(function (resolve) {
    (function poll() {
      if (!test()) return requestAnimFrame(poll, 50);
      return resolve();
    })();
  });
}

const observeSelector = (
  selector,
  callback,
  options = {
    timeout: null,
    once: false,
    onTimeout: null,
    document: window.document,
  }
) => {
  let processed = new Map();

  if (options.timeout || options.onTimeout) {
    console.log(
      "------------------------------------------------------------------------------------------------------------------------------"
    );
    console.log(
      "WARNING: observeSelector options timeout and onTimeout are not yet implemented."
    );
    console.log(
      "------------------------------------------------------------------------------------------------------------------------------"
    );
  }

  let obs,
    isDone = false;
  const done = () => {
    if (!obs) console.warn("observeSelector failed to run done()");
    if (obs) obs.disconnect();
    processed = undefined;
    obs = undefined;
    return (isDone = true);
  };

  const processElement = (el) => {
    if (processed && !processed.has(el)) {
      processed.set(el, true);
      callback(el);
      if (options.once) {
        done();
        return true;
      }
    }
  };

  const lookForSelector = (el = document) => {
    if (el.matches && el.matches(selector)) {
      if (processElement(el)) return true;
    }
    if (el.querySelectorAll) {
      const elements = el.querySelectorAll(selector);
      if (elements.length) {
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          if (processElement(el)) return true;
        }
      }
    }
  };
  lookForSelector();

  //We might finish before the mutation observer is necessary:
  if (!isDone) {
    obs = new MutationObserver((mutationsList) => {
      mutationsList.forEach((record) => {
        if (record && record.addedNodes && record.addedNodes.length) {
          for (let i = 0; i < record.addedNodes.length; i++) {
            //Need to check from the parent element since sibling selectors can be thrown off if elements show up in non-sequential order
            const el = record.addedNodes[i].parentElement;
            // if (!el) console.warn('observeSelector element has no parent', record.addedNodes[i], record);
            //Note: This appears to also run when elements are removed from the DOM. If the element doesn't have a parent then we don't need to check it.
            if (el && lookForSelector(el)) return true;
          }
        }
      });
    });
    obs.observe(options.document || document, {
      attributes: false,
      childList: true,
      subtree: true,
    });
  }

  return () => {
    done();
  };
}; //_observeSelector

//-----------

const getParam = (name, optSearch) => {
  "use strict";
  optSearch = optSearch || location.search;
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(optSearch);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
};

//-----------

const js_loadScript = (url, optCallback) => {
  "use strict";
  const ga = document.createElement("script");
  ga.type = "text/javascript";
  ga.async = true;
  ga.src = url;
  if (typeof optCallback === "function") {
    ga.onload = optCallback;
  }
  const s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(ga, s);
};

//----

const cart_remove_items = (var_ids) => {
  //check cart, and if any specified items exist, remove them
  console.log(`cart_remove_items(${var_ids})`);
  get_cart_json().then((data) => {
    for (let i = 0; i < data.items.length; i++) {
      for (let ii = 0; ii < var_ids.length; ii++) {
        console.log(
          `searching for ${var_ids[ii]} === ${data.items[i].variant_id}`
        );
        if (data.items[i].variant_id === var_ids[ii]) {
          console.log(`... removing ${var_ids[ii]}`);
          $.ajax({
            type: "POST",
            url: "/cart/change.js",
            data: { quantity: 0, id: var_ids[ii] },
            dataType: "json",
          });
        }
      } //endfor ii
    } //endfor i
  });
};

const cart_add_item = (var_id, qty, upsell = false) => {
  var items = {
    quantity: qty,
    id: var_id,
    properties: {
      _upsell: upsell,
    },
  };
  $.ajax({
    type: "POST",
    url: "/cart/add.js",
    dataType: "json",
    data: items,
    success: function (data) {
      console.log("success upsell");
      console.log(data);
    },
    error: function () {
      console.log("error");
    },
  });
};

const get_cart_json = () => {
  // console.log(`get_cart_json()`);
  return $.ajax({
    type: "GET",
    url: "/cart.js",
    dataType: "json",
    success: function (data) {
      // return data;
    },
  });
};

const cart_contains_subscription = () => {
  return get_cart_json().then((data) => {
    for (let i = 0; i <= data.items.length; i++) {
      if (i === data.items.length) {
        // console.log('no subs found', i);
        return false;
      } else {
        if (
          data.items[i].properties &&
          data.items[i].properties.shipping_interval_frequency
        ) {
          // console.log("subs found in item", i);
          return true;
        } else {
          // console.log('has properties, not sub tho', i);
        }
      }
    }
  });
};

const cart_contains_item = (var_id) => {
  // console.log(`cart_contains_item(${var_id})`);
  return get_cart_json().then((data) => {
    for (let i = 0; i <= data.items.length; i++) {
      if (i === data.items.length) {
        // console.log('item not found', i);
        return false;
      } else {
        if (data.items[i].variant_id === var_id) {
          // console.log("item found", i);
          return true;
        }
      }
    }
  });
};

/*
cart_contains_item(39321012895847).then(response => {
  console.log("cart_contains_item(39321012895847)",response);
});
*/

// loadScript("https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js", () => {
//   console.log("jQuery re-loaded");
// }); //loadScript()

//----
