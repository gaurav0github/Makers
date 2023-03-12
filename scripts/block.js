"use strict";

var storage = new LocalStorage();
var blockSiteUrl;
var blockSiteTime;
var blockSiteCounter;
var restrictionList = [];

document.addEventListener("DOMContentLoaded", function () {
  var url = new URL(document.URL);
  blockSiteUrl = url.searchParams.get("url");
  blockSiteTime = url.searchParams.get("summaryTime");
  blockSiteCounter = url.searchParams.get("counter");
  document.getElementById("site").innerText = extractHostname(blockSiteUrl);
  document.getElementById("deferredTime").innerText =
    convertShortSummaryTimeToString(blockSiteTime);

  storage.getValue(STORAGE_RESTRICTION_LIST, function (items) {
    restrictionList = items;
    if (restrictionList === undefined) restrictionList = [];
    var currentItem = restrictionList.find((x) =>
      isDomainEquals(extractHostname(x.domain), extractHostname(blockSiteUrl))
    );
  });
});
