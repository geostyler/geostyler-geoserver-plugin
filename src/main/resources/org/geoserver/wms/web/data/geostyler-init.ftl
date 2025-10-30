(function () {
  /**
   *  try to find CSP nonce from various places in the DOM
  */
  function guessNonce() {
    var results = [];
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );
    var node;
    while ((node = walker.nextNode())) {
      if (node.nonce || node.dataset.nonce) {
        results.push({
          tag: node.tagName,
          id: node.id,
          class: node.className,
          nonce: node.nonce,
          dataNonce: node.dataset.nonce
        });
      }
    }
    if (results.length > 0) {
      return results[0].nonce || results[0].dataNonce;
    }
    return null;
  }

  // get infos from GeoServer
  var layerNames = '${layer}';
  var layerType = '${layerType}';
  var basePath = '${basePath}';

  // append some divs to the DOM right above the code editor
  var root = document.createElement('div');
  var title = document.createElement('span');
  var geoStylerDiv = document.createElement('div');
  var checkboxWrapper = document.createElement('div');
  var liveUpdateCheckbox = document.createElement('input');
  var liveUpdateLabel = document.createElement('label');
  checkboxWrapper.id = 'checkboxwrapper';
  title.innerText = 'GeoStyler';
  title.id = 'geoStylerTitle';
  liveUpdateCheckbox.id = 'liveUpdate';
  liveUpdateCheckbox.type = 'checkbox';
  liveUpdateLabel.for = 'liveUpdate';
  liveUpdateLabel.innerHTML = 'Live preview enabled? ' +
    '(automatically saves the style on changes)';
  geoStylerDiv.id = 'geostyler-div';
  geoStylerDiv.innerHTML = 'GeoStyler is loading ...';
  root.id = 'geostyler-root';

  checkboxWrapper.appendChild(liveUpdateCheckbox);
  checkboxWrapper.appendChild(liveUpdateLabel);

  root.appendChild(title);
  root.appendChild(checkboxWrapper);
  root.appendChild(geoStylerDiv);

  var reactRoot = ReactDOM.createRoot(geoStylerDiv);

  var codeEditor = document.getElementById('style-editor');
  var codeMirror = document.gsEditors.editor;
  document.querySelector('#styleForm').insertBefore(root, codeEditor);

  // handle GeoStyler changes and update the SLD in editor
  var styleParser = new GeoStylerSLDParser.SldStyleParser({
    builderOptions: {
      format: true
    }
  });

  var onChange = function (styleObj) {
    styleParser.writeStyle(styleObj)
      .then(function (sld) {
        codeMirror.setValue(sld.output);
        if (liveUpdateCheckbox.checked) {
          // apply settings immediately
          document.querySelector('.form-button-apply').click();
        }
      });
  };

  var geoStylerProps = {
    onStyleChange: onChange,
    disableClassification: true
  };
  var geoStylerContextValues = {
    composition: {
      Rule: {
        amountField: {
          visibility: false
        },
        duplicateField: {
          visibility: false
        }
      },
      RuleCard: {
        amountField: {
          visibility: false
        },
        duplicateField: {
          visibility: false
        }
      }
    }
  };

  /**
   *
   * @param props {Object} The props to re-render the GeoStyler component
   */
  var reRenderGeoStyler = function (props, contextValues) {
    var fullScreen = document.getElementById('page').classList.contains('fullscreen');
    geoStylerContextValues = contextValues;

    var nonce = guessNonce();

    var geostylerStyle = React.createElement(
      fullScreen ? GeoStyler.CardStyle : GeoStyler.Style,
      props
    );

    var geostylerContext = React.createElement(
      GeoStyler.GeoStylerContext.Provider,
      { value: geoStylerContextValues || {} },
      geostylerStyle
    );

    // Wrap with Ant Design ConfigProvider for CSP support
    var finalComponent;
    if (nonce && typeof antd !== 'undefined' && antd.ConfigProvider) {
      finalComponent = React.createElement(
        antd.ConfigProvider,
        { csp: { nonce: nonce } },
        geostylerContext
      );
    } else {
      if (!nonce) {
        console.warn('No CSP nonce found - using GeoStyler without Ant Design CSP config');
      }
      if (typeof antd === 'undefined' || !antd.ConfigProvider) {
        console.warn('Ant Design ConfigProvider not available - using GeoStyler without CSP config');
      }
      finalComponent = geostylerContext;
    }

    GeoStyler.locale.de_DE.RuleFieldContainer.nameFieldLabel = 'GeoStyler';
    reactRoot.render(finalComponent);
  };

  // handle code editor changes and apply to GeoStyler
  codeMirror.on('change', function () {
    styleParser.readStyle(codeMirror.getValue())
      .then(function (style) {
        var props = Object.assign({}, geoStylerProps);
        props.style = style.output;
        reRenderGeoStyler(props, geoStylerContextValues);
      });
  });

  // parse SLD if available
  var stylePromise = Promise.resolve();
  if (codeMirror.getValue().length > 0) {
    stylePromise = styleParser.readStyle(codeMirror.getValue());
  }

  // fetch a feature when working on a vector layer
  var getFeaturePromise = Promise.resolve();
  if (layerType.toLowerCase() === 'vector') {
    var wfsParser = new WfsDataParser.WfsDataParser();
    getFeaturePromise = wfsParser.readData({
      url: window.location.origin + basePath,
      fetchParams: {
        credentials: 'same-origin'
      },
      requestParams: {
        version: '2.0.0',
        typeNames: layerNames,
        srsName: 'EPSG:4326',
        count: 1
      },
    });
  }

  // finally build the GeoStyler with the parsed style and feature, if available
  Promise.all([stylePromise, getFeaturePromise])
    .then(function (response) {
      geoStylerProps.style = response[0].output;
      geoStylerContextValues.data = response[1];
      reRenderGeoStyler(geoStylerProps, geoStylerContextValues);
    });

  // Change geostyler layout on full screen toggle
  var observer = new MutationObserver(function () {
    reRenderGeoStyler(geoStylerProps, geoStylerContextValues);
  });
  observer.observe(document.getElementById('page'), {
    attributes: true,
    attributeFilter: ['class'],
    childList: false,
    characterData: false
  });

})();
