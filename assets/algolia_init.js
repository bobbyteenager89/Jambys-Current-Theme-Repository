window.algoliaShopify = window.algoliaShopify || {};
(function(cfg){
  if(!cfg.appId || !cfg.apiKey){
    console.warn('Algolia credentials missing');
    return;
  }
  if (typeof algoliasearch !== 'undefined') {
    window.algoliaShopify.client = algoliasearch(cfg.appId, cfg.apiKey);
  }
})(window.algoliaShopify.config || {});
