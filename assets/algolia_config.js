window.algoliaShopify = window.algoliaShopify || {};
window.algoliaShopify.config = {
  appId: '{{ shop.metafields.algolia_search.app_id | default: "" }}',
  apiKey: '{{ shop.metafields.algolia_search.search_api_key | default: "" }}',
  indexPrefix: '{{ shop.metafields.algolia_search.index_prefix | default: "" }}'
};
