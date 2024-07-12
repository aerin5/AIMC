(function(fhirClient) {
    'use strict';
  
    /**
     * Prereq: This library should be included after fhir-client.js library.
     *
     * Automatically sets the fullSessionStorageSupport flag
     * when this library is included after fhir-client.js.
     * The boolean value is computed based on whether the page
     * is rendered within PowerChart or elsewhere.
     *
     * If the page is rendered within PowerChart, the value will
     * be set to false.  This is done to prevent session data
     * to be shared between applications. The reason is the embedded
     * IE browser is instantiated on a single thread in PowerChart.
     */
    fhirClient.oauth2.settings.fullSessionStorageSupport = !isPowerChart();
  
    function isPowerChart() {
      return window.external && typeof window.external.DiscernObjectFactory !== 'undefined';
    }
  
  })(FHIR);
  