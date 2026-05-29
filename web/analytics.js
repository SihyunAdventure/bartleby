// Bartleby landing-site analytics (PostHog).
//
// Loaded on every static page via `<script src="/analytics.js" defer>`.
// Tracks page views + the Download-for-Mac conversion funnel. The project
// API key below is a PUBLIC key — it is meant to ship in client code and
// only allows event ingestion, not data reads. Swap it for the real
// `phc_...` key from PostHog → Project Settings.
(function () {
  var POSTHOG_KEY = "phc_zGxcMQbRAsX6rhTesDGwBJ5KEsp7JuVj7y7Nx8gHmCgC";
  var POSTHOG_HOST = "https://us.i.posthog.com";

  // Don't boot in local preview or before the key is set.
  if (
    !POSTHOG_KEY ||
    POSTHOG_KEY.indexOf("REPLACE") !== -1 ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  ) {
    return;
  }

  // Official PostHog loader snippet.
  !(function (t, e) {
    var o, n, p, r;
    e.__SV ||
      ((window.posthog = e),
      (e._i = []),
      (e.init = function (i, s, a) {
        function g(t, e) {
          var o = e.split(".");
          2 == o.length && ((t = t[o[0]]), (e = o[1])),
            (t[e] = function () {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            });
        }
        ((p = t.createElement("script")).type = "text/javascript"),
          (p.crossOrigin = "anonymous"),
          (p.async = !0),
          (p.src =
            s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") +
            "/static/array.js"),
          (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r);
        var u = e;
        for (
          void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
            u.people = u.people || [],
            u.toString = function (t) {
              var e = "posthog";
              return (
                "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e
              );
            },
            u.people.toString = function () {
              return u.toString(1) + ".people (stub)";
            },
            o =
              "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(
                " "
              ),
            n = 0;
          n < o.length;
          n++
        )
          g(u, o[n]);
        e._i.push([i, s, a]);
      }),
      (e.__SV = 1));
  })(document, window.posthog || []);

  window.posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: "2025-05-24",
    person_profiles: "identified_only",
    // Marketing site: autocapture gives the pageview→download funnel for free.
    autocapture: true,
    capture_pageview: true,
    disable_session_recording: true,
  });

  // Explicit, structured download event so the funnel doesn't rely on
  // autocapture's element guessing. Delegated so it covers every .dmg link
  // (nav button, hero, download card) on any page.
  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('a[href$=".dmg"]');
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var match = href.match(/Bartleby[_-]?v?([0-9]+\.[0-9]+\.[0-9]+)/i);
    window.posthog.capture("download_clicked", {
      version: match ? match[1] : "unknown",
      href: href,
      placement: a.className || "link",
    });
  });
})();
