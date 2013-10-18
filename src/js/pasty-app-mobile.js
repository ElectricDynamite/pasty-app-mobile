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
    useLocalStorage: false,
    client: null,
    setPastyClient: function(client) {
      console.log("setPastyClient(): useLocalStorage is: "+this.useLocalStorage);
      if(this.useLocalStorage) localStorage.setItem('pastyApp_pastyClient_target', JSON.stringify(client.target));
      this.client = client;
    },
    getPastyClient: function() {
      console.log("getPastyClient(): client is: "+this.client);
      if(this.client === null && this.useLocalStorage === true) {
        var restoredTarget = JSON.parse(localStorage.getItem('pastyApp_pastyClient_target'));
        if(restoredTarget !== null) {
          this.client = new PastyClient(restoredTarget);
        }
      }
      console.log("getPastyClient() and now it is: "+this.client);
      return this.client;
    },
    login: function() {
      $("#popupLogin").popup('open');
    },
    getClipboard: function(callback) {
      callback = callback || $.noop;
      $.mobile.loading('show');
      var self = this;
      this.client.listItems(function(err, data) {
        if(err === null) {
          var parent = $("#clipboard");
          for(var i = 0; i < data.length; i++) {
            var node = document.createElement('li');
            var nodePopup = document.createElement('div');
            nodePopup.setAttribute('data-role', 'popup');
            nodePopup.setAttribute('data-theme', 'e');
            nodePopup.setAttribute('data-transition', 'pop');
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
            node.innerHTML = '<a class="copy" href="#" data-ciid="'+data[i]._id+'">\
              '+data[i].item+'</a><a class="delete" href="#" data-role="button" data-icon="delete"\
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
            self.deleteItem($(this).attr('data-ciid'));
          });
        } else {
          self.errorHandler(err);
        }
        $.mobile.loading('hide');
        callback();
      });
    },
    addItem: function(item) {
    },
    deleteItem: function(ciid) {
      alert("deleteItem: "+ciid);
    },
    errorHandler: function(err) {
      if(err === null) return; // if no error is provided, return
      err.statusCode = err.statusCode || 500;
      err.code = err.code || "";
      err.message = err.message || "";
      switch(err.code) {
        case "UnauthorizedError":
          //this.login();
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
