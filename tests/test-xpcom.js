var xpcom = require("xpcom");

exports.testXpcom = function(test, text) {
  if (!text)
    text = "hai2u";

  function Component() {}

  Component.prototype = {
    newChannel : function(aURI) {
      var ios = Cc["@mozilla.org/network/io-service;1"].
                getService(Ci.nsIIOService);

      var channel = ios.newChannel(
        "data:text/plain," + text,
        null,
        null
      );

      channel.originalURI = aURI;
      return channel;
    },
    getURIFlags: function(aURI) {
        return Ci.nsIAboutModule.ALLOW_SCRIPT;
    },
    QueryInterface: xpcom.utils.generateQI([Ci.nsIAboutModule])
  };

  var contractID = "@mozilla.org/network/protocol/about;1?what=boop";

  var factory = xpcom.register({name: "test about:boop page",
                                contractID: contractID,
                                create: Component});

  var manager = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
  test.assertEqual(manager.isContractIDRegistered(contractID), true);

  // We don't want to use Cc[contractID] here because it's immutable,
  // so it can't accept updated versions of a contractID during the
  // same application session.
  var aboutFactory = xpcom.getClass(contractID, Ci.nsIFactory);
  var about = aboutFactory.createInstance(null, Ci.nsIAboutModule);
  var ios = Cc["@mozilla.org/network/io-service;1"].
            getService(Ci.nsIIOService);
  test.assertEqual(
    about.getURIFlags(ios.newURI("http://foo.com", null, null)),
    Ci.nsIAboutModule.ALLOW_SCRIPT
  );

  var aboutURI = ios.newURI("about:boop", null, null);
  var channel = ios.newChannelFromURI(aboutURI);
  var iStream = channel.open();
  var siStream = Cc['@mozilla.org/scriptableinputstream;1']
                 .createInstance(Ci.nsIScriptableInputStream);
  siStream.init(iStream);
  var data = new String();
  data += siStream.read(-1);
  siStream.close();
  iStream.close();
  test.assertEqual(data, text);

  factory.unregister();
  test.assertEqual(manager.isContractIDRegistered(contractID), false);
};

exports.testXpcomAgain = function(test) {
  exports.testXpcom(test, "hai2u again");
};
