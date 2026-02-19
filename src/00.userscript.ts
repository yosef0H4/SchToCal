// ==UserScript==
// @name         PSAU Schedule to ICS Downloader (with Saving & Reset)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Adds a control panel to download the course schedule as an ICS file. Remembers all your settings. Features an Arabic UI, language toggle, and a user guide.
// @author       You
// @match        https://eserve.psau.edu.sa/ku/ui/*
// @grant        none
// ==/UserScript==

((): void => {
  "use strict";

  const observer = new MutationObserver((_, obs) => {
    const anchorElement = document.querySelector("a#myForm\\:printLink");
    if (anchorElement) {
      obs.disconnect();
      SchMakerApp.initializeScript();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
