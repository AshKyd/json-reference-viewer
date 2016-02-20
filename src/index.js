var jref = require('json-ref-lite');
var editor = ace.edit("editor");

/**
 * Stringify. Borrowed from https://github.com/isaacs/json-stringify-safe.
 */
function circularSafeStringify(n){function i(n,i,u,l){return JSON.stringify(n,r(i,l),u)}function r(n,i){var r=[],u=[];return null==i&&(i=function(n,i){return r[0]===i?"[Circular ~]":"[Circular ~."+u.slice(0,r.indexOf(i)).join(".")+"]"}),function(l,t){if(r.length>0){var e=r.indexOf(this);~e?r.splice(e+1):r.push(this),~e?u.splice(e,1/0,l):u.push(l),~r.indexOf(t)&&(t=i.call(this,l,t))}else r.push(t);return null==n?t:n.call(this,l,t)}}return i(n,null,4)}

editor.setTheme("ace/theme/chrome");
editor.getSession().setMode("ace/mode/json");

// Possible Ace race condition sometimes leaves the editor broken.
setTimeout( () => editor.resize(), 50);

var snackbarContainer = document.querySelector('#snackbar');

function parse(jsonString){
  if(!jsonString) return new Error();
  try{
    return JSON.parse(jsonString);
  } catch(e) {
     snackbarContainer.MaterialSnackbar.showSnackbar({
       message: 'Malformed JSON.',
       timeout: 4000,
     });
     return new Error();
   }
}

function setValue(json){
  try{
    editor.setValue(circularSafeStringify(json, null, 4));
    editor.moveCursorTo(0,0);
    editor.resize();
  } catch(e){
    console.error(e);
    return snackbarContainer.MaterialSnackbar.showSnackbar({
      message: 'Could not stringify resolved JSON. Is it circular?',
      timeout: 4000,
    });
  }
}

var actions = {
  beautify: function(){
    var parsed = parse(editor.getValue());
    if(parsed instanceof Error) return;

    setValue(parsed);
  },
  resolve: function(){
    var resolved;
    var unresolved = parse(editor.getValue());
    if(unresolved instanceof Error) return;

    // There's no text yet.
    if(!unresolved) return;
    try{
      resolved = jref.resolve(unresolved);
    }catch(e){
      return snackbarContainer.MaterialSnackbar.showSnackbar({
        message: e.message,
        timeout: 4000,
      });
    }
    setValue(resolved);
  },
};

Array.from(document.querySelectorAll('[data-action]')).forEach(function(element){
  element.addEventListener('click', actions[element.dataset.action]);
});
