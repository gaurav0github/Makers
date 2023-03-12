var storage = new LocalStorage();
var blackList = [];
var restrictionList = [];
var notifyList = [];
var blockBtnList = ["settingsBtn", "restrictionsBtn"];
var blockList = ["settingsBlock", "restrictionsBlock"];

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("clearAllData")
    .addEventListener("click", function () {
      clearAllData();
    });
  document
    .getElementById("addRestrictionSiteBtn")
    .addEventListener("click", function () {
      addNewSiteClickHandler(
        "addRestrictionSiteLbl",
        "addRestrictionTimeLbl",
        actionAddRectrictionToList,
        "notifyForRestrictionList"
      );
    });
  // document.getElementById('darkMode').addEventListener('change', function () {
  //     storage.saveValue(SETTINGS_DARK_MODE, this.checked);
  // });
  document
    .getElementById("intervalInactivity")
    .addEventListener("change", function () {
      storage.saveValue(SETTINGS_INTERVAL_INACTIVITY, this.value);
    });
  $(".clockpicker").clockpicker();
  loadSettings();
});

function setBlockEvent(btnName, blockName) {
  blockBtnList.forEach((element) => {
    if (element === btnName) {
      document.getElementById(btnName).classList.add("active");
    } else document.getElementById(element).classList.remove("active");
  });
  blockList.forEach((element) => {
    if (element === blockName) {
      document.getElementById(blockName).hidden = false;
    } else document.getElementById(element).hidden = true;
  });
}

function loadSettings() {
  storage.getValue(SETTINGS_INTERVAL_INACTIVITY, function (item) {
    document.getElementById("intervalInactivity").value = item;
  });
  // storage.getValue(SETTINGS_DARK_MODE, function (item) {
  //     document.getElementById('darkMode').checked = item;
  // });
  storage.getMemoryUse(STORAGE_TABS, function (integer) {
    document.getElementById("memoryUse").innerHTML =
      (integer / 1024).toFixed(2) + "Kb";
  });
  storage.getValue(STORAGE_TABS, function (item) {
    let s = item;
  });
  storage.getValue(STORAGE_RESTRICTION_LIST, function (items) {
    restrictionList = items;
    if (restrictionList === undefined) restrictionList = [];
    viewRestrictionList(items);
  });
}

function loadVersion() {
  var version = chrome.runtime.getManifest().version;
  document.getElementById("version").innerText = "v" + version;
}

function viewRestrictionList(items) {
  if (items !== undefined) {
    for (var i = 0; i < items.length; i++) {
      addDomainToEditableListBox(
        items[i],
        "restrictionsList",
        actionEditSite,
        deleteRestrictionSite,
        updateItemFromResctrictoinList,
        updateRestrictionList
      );
    }
  }
}

function clearAllData() {
  var tabs = [];
  chrome.extension.getBackgroundPage().tabs = tabs;
  storage.saveTabs(tabs, allDataDeletedSuccess);
}

function allDataDeletedSuccess() {
  viewNotify("notify");
}

function viewNotify(elementName) {
  document.getElementById(elementName).hidden = false;
  setTimeout(function () {
    document.getElementById(elementName).hidden = true;
  }, 3000);
}

function actionAddRectrictionToList(newSite, newTime) {
  if (!isContainsRestrictionSite(newSite)) {
    var restriction = new Restriction(newSite, newTime);
    addDomainToEditableListBox(
      restriction,
      "restrictionsList",
      actionEditSite,
      deleteRestrictionSite,
      updateItemFromResctrictoinList,
      updateRestrictionList
    );
    if (restrictionList === undefined) restrictionList = [];
    restrictionList.push(restriction);
    document.getElementById("addRestrictionSiteLbl").value = "";
    document.getElementById("addRestrictionTimeLbl").value = "";
    updateRestrictionList();
    return true;
  } else return false;
}

function addNewSiteClickHandler(lblName, timeName, actionCheck, notifyBlock) {
  var newSite = document.getElementById(lblName).value;
  var newTime;
  if (timeName != null) newTime = document.getElementById(timeName).value;
  if (
    newSite !== "" &&
    (newTime === undefined || (newTime !== undefined && newTime !== ""))
  ) {
    if (!actionCheck(newSite, newTime))
    {
        viewNotify(notifyBlock);
    }
  }
}

function addDomainToListBox(domain) {
  var li = document.createElement("li");
  li.innerText = domain;
  var del = document.createElement("img");
  del.height = 12;
  del.src = "/icons/delete.png";
  del.addEventListener("click", function (e) {
    deleteBlackSite(e);
  });
}

function addDomainToEditableListBox(
  entity,
  elementId,
  actionEdit,
  actionDelete,
  actionUpdateTimeFromList,
  actionUpdateList
) {
  var li = document.createElement("li");
  li.classList.add("site-list");

  var domainLbl = document.createElement("input");
  domainLbl.type = "text";
  domainLbl.classList.add("readonly-input", "inline-block", "element-item");
  domainLbl.value = entity.domain;
  domainLbl.readOnly = true;
  domainLbl.setAttribute("name", "domain");

  var edit = document.createElement("img");
  edit.setAttribute("name", "editCmd");
  edit.height = 14;
  edit.src = "/icons/edit.png";
  edit.addEventListener("click", function (e) {
    actionEdit(e, actionUpdateTimeFromList, actionUpdateList);
  });

  var del = document.createElement("img");
  del.height = 12;
  del.src = "/icons/delete.png";
  del.classList.add("margin-left-5");
  del.addEventListener("click", function (e) {
    actionDelete(e, actionUpdateTimeFromList, actionUpdateList);
  });

  var bloc = document.createElement("div");
  bloc.classList.add("clockpicker");
  bloc.setAttribute("data-placement", "left");
  bloc.setAttribute("data-align", "top");
  bloc.setAttribute("data-autoclose", "true");
  var timeInput = document.createElement("input");
  timeInput.type = "text";
  timeInput.classList.add("clock", "clock-li-readonly");
  timeInput.setAttribute("readonly", true);
  timeInput.setAttribute("name", "time");
  timeInput.value = convertShortSummaryTimeToString(entity.time);
  bloc.appendChild(timeInput);
  var li = document.getElementById(elementId).appendChild(li);
  li.appendChild(domainLbl);
  li.appendChild(bloc);
  li.appendChild(edit);
  li.appendChild(del);
}

function deleteRestrictionSite(e) {
  var targetElement = e.composedPath()[1];
  var itemValue = targetElement.querySelector("[name='domain']").value;
  var item = restrictionList.find((x) => x.domain == itemValue);
  restrictionList.splice(restrictionList.indexOf(item), 1);
  document.getElementById("restrictionsList").removeChild(targetElement);
  updateRestrictionList();
}

function actionEditSite(e, actionUpdateTimeFromList, actionUpdateList) {
  var targetElement = e.composedPath()[1];
  var domainElement = targetElement.querySelector('[name="domain"]');
  var timeElement = targetElement.querySelector('[name="time"]');
  if (timeElement.classList.contains("clock-li-readonly")) {
    timeElement.classList.remove("clock-li-readonly");
    var hour = timeElement.value.split(":")[0].slice(0, 2);
    var min = timeElement.value.split(":")[1].slice(1, 3);
    timeElement.value = hour + ":" + min;
    var editCmd = targetElement.querySelector('[name="editCmd"]');
    editCmd.src = "/icons/success.png";
    $(".clockpicker").clockpicker();
  } else {
    var domain = domainElement.value;
    var time = timeElement.value;
    if (domain !== "" && time !== "") {
      var editCmd = targetElement.querySelector('[name="editCmd"]');
      editCmd.src = "/icons/edit.png";
      timeElement.classList.add("clock-li-readonly");
      var resultTime = convertShortSummaryTimeToString(
        convertTimeToSummaryTime(time)
      );
      timeElement.value = resultTime;

      actionUpdateTimeFromList(domain, time);
      actionUpdateList();
    }
  }
}

function isContainsRestrictionSite(domain) {
  return restrictionList.find((x) => x.domain == domain) != undefined;
}

function updateItemFromResctrictoinList(domain, time) {
  restrictionList.find((x) => x.domain === domain).time =
    convertTimeToSummaryTime(time);
}

function updateRestrictionList() {
  storage.saveValue(STORAGE_RESTRICTION_LIST, restrictionList);
}