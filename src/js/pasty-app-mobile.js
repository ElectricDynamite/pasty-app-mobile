/*
 * Copyright (c) 2013 Philipp Geschke
 * pasty-app-mobile, a HTML5 client app for http://www.pastyapp.org
 * 
 * This file is part of pasty-app-mobile
 * 
 * pasty-app-mobile is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */


var pastyApp = (function(){

  return {
    version: '0.1.0',
    useLocalStorage: true,
    client: null,
    loginSuccess: false,
    setPastyClient: function(client) {
      console.log("setPastyClient(): useLocalStorage is: "+this.useLocalStorage);
      this.client = client;
      if(this.useLocalStorage) this.saveToLocalStorage();
    },
    getPastyClient: function() {
      console.log("getPastyClient(): client is: "+this.client);
      if(this.client === null && this.useLocalStorage === true) {
        this.restoreFromLocalStorage();
      }
      console.log("getPastyClient() and now it is: "+this.client);
      return this.client;
    },
    saveToLocalStorage: function() {
      if(this.useLocalStorage !== true) return;
      if(this.client !== null) {
        localStorage.setItem('pastyApp_pastyClient_target', JSON.stringify(this.client.target));
        localStorage.setItem('pastyApp_loginSuccess', this.loginSuccess);
      }
    },
    restoreFromLocalStorage: function() {
       var restoredTarget = JSON.parse(localStorage.getItem('pastyApp_pastyClient_target'));
       var loginSuccess =localStorage.getItem('pastyApp_loginSuccess');
       loginSuccess = (loginSuccess == "true") ? true : false;
       if(restoredTarget !== null && loginSuccess == true) {
          this.client = new PastyClient(restoredTarget);
          this.loggedIn(loginSuccess);
       }
    },
    login: function(lastWasBad) {
      if(lastWasBad) {
        $("#loginFailedMessage").text($.t('error.login_failed'));
      }
      $("#popupLogin").popup('open');
    },
    logout: function() {
      $("#clipboard").empty();
      $("#username").val("");
      $("#password").val("");
      this.loggedIn(false);
      
    },
    loggedIn: function(bool) {
      if(bool === undefined) return this.loginSuccess;
      if(typeof(bool) == "boolean") {
        this.loginSuccess = bool;
        if(bool === true) {
          $("#headerLoginButton").attr('href', "javascript:pastyApp.logout()");
          $("#headerLoginButton").find('.ui-btn-text').text($.t('global.logout'));
        } else {
          $("#headerLoginButton").attr('href', "#popupLogin");
          $("#headerLoginButton").find('.ui-btn-text').text($.t('global.login'));
        }
        this.saveToLocalStorage();
      }
    },
    getClipboard: function(callback) {
      callback = callback || $.noop;
      $.mobile.loading('show');
      var self = this;
      this.client.listItems(function(err, data) {
        if(err === null) {
          var parent = $("#clipboard");
          parent.empty();
          for(var i = 0; i < data.length; i++) {
            var node = document.createElement('li');
            var nodePopup = document.createElement('div');
            nodePopup.setAttribute('data-role', 'popup');
            nodePopup.setAttribute('data-theme', 'e');
            nodePopup.setAttribute('data-transition', 'pop');
            nodePopup.setAttribute('data-overlay-theme', 'a');
            nodePopup.setAttribute('id',data[i]._id);
            nodePopup.setAttribute('class', 'ui-content');
            nodePopup.innerHTML = '\
              <a href="#" data-rel="back" data-role="button" data-theme="a" \
                data-icon="delete" data-iconpos="notext" class="ui-btn-left">Close</a> \
              <p>'+$.t('copy_view.description')+'</p> \
              <textarea style="width: 100%">'+data[i].item+'</textarea>';
            document.body.appendChild(nodePopup);
            $("#"+data[i]._id).popup();
            $("#"+data[i]._id).children('a').button();
            node.innerHTML = '<a class="copy" href="#" id="item-'+data[i]._id+'" data-ciid="'+data[i]._id+'">\
              '+data[i].item+'</a><a class="delete" href="#" data-role="button" data-icon="minus"\
               data-iconpos="notext" data-ciid="'+data[i]._id+'">Delete</a>'
            clipboard.appendChild(node);
          }
          parent.listview('refresh');
            $(".copy").click(function(event) {
            event.preventDefault();
            $("#"+$(this).attr('data-ciid')).popup('open');
          });
          $(".delete").click(function(event) {
            event.preventDefault();
            self.confirmDelete($(this).attr('data-ciid'));
          });
        } else {
          self.errorHandler(err);
        }
        $.mobile.loading('hide');
        self.saveToLocalStorage();
        callback();
      });
    },
    addItem: function(item) {
      var self = this;
      if(this.client != null) {
        this.client.addItem(item, function(err, itemid) {
          if(err === null) {
            self.getClipboard();
          } else {
            self.errorHandler(err);
          }
        });
      }
    },
    confirmDelete: function(ciid) {
      $("#popupDeleteConfirmCIID").val(ciid);
      $("#popupDeleteConfirmItem").text($("#item-"+ciid).text());
      $("#popupDeleteConfirm").popup('open');
    },
    deleteItem: function(ciid) {
      var self = this;
      if(this.client != null) {
        this.client.deleteItem(ciid, function(err, success) {
          if(err === null) {
            self.getClipboard();
          } else {
            self.errorHandler(err);
          }
        });
      }
    },
    errorHandler: function(err) {
      if(err === null) return; // if no error is provided, return
      err.statusCode = err.statusCode || 500;
      err.code = err.code || "";
      err.message = err.message || "";
      switch(err.code) {
        case "UnauthorizedError":
          this.loggedIn(false);
          this.login(true);
          break;
        default:
          if(err.code !== "") this.displayErrorMessage(err.message);
          break;
      }
      if(err.code !== "") this.displayErrorMessage(err.message);
    },
    displayErrorMessage: function(message) {
        $("#popupErrorMessage").text(message);
        $("#popupError").popup('open');
    }
  };
}());
