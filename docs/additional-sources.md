# Additional donghua sources and recognition, 2026-10-27

Public source pages were checked with an honest AnimeJJ user agent, without CAPTCHA solving, fingerprint impersonation, header spoofing, DRM removal or video proxying.

- AnimeXin: https://animexin.dev/throne-of-seal/ returned an episode index covering absolute 1–208. Exact AniList season mapping: 146409 = 1–26; 153499 = 27–156; 185729 = 157–208. These boundaries preserve local season episode numbers used by the existing subtitle mapping.
- DonghuaStream: https://donghuastream.org/anime/throne-of-seal2/ returned absolute 57–208. This is a partial alternative, not a complete first season source.
- The new isolated animejj-donghua function only reads fixed provider origins and verified episode links. Its public publishable key identifies the client, not a person. It reads no database, room, session or server secrets. Responses are size/time bounded, redirects are rejected, HTML is never executed, and caches/rate limits are bounded per instance.
- Episode listings do not prove playback availability. Compatible public Odysee MP4 streams and Dailymotion embeds are returned; removed, restricted, incompatible or regional videos remain unavailable. Some streams contain burned-in English and cannot hide it. The chosen provider is preserved in the stable room/history reference. The user can choose AniZone, AnimeXin or DonghuaStream in the episode sheet. Automatic lookup favors AnimeXin for the three verified Throne of Seal seasons and can fall back to the others.
- Direct Dailymotion manifest probe returned 403. We did not attempt to defeat that restriction; Dailymotion playback uses its official embed SDK. Odysee playback uses its documented public SDK get method and only accepts HTTPS player.odycdn.com stream URLs, without video proxying or custom authorization headers. The publicly published player configurations are kept, including the AnimeXin x1kcvu configuration observed in the latest episode embed for its older legacy links. Ads and regional restrictions remain in effect. Ads may temporarily desynchronize viewers; no exact ad synchronization is claimed.

Research references (not copied implementation):
- https://github.com/Seanime-contributions/Seanime-Providers/blob/main/src/anime/donghuastream/provider.js (MIT, format reference for public option elements)
- https://developers.dailymotion.com/docs/player-library-script
- https://developers.dailymotion.com/reference/web-sdk-player-methods
- https://developers.dailymotion.com/reference/web-sdk-player-states
- https://developers.dailymotion.com/reference/web-sdk-player-events

Speech generation now processes independent 30-second audio blocks. Completed blocks persist in the bounded local IndexedDB cache and can be resumed by selecting the same decoded audio, language and model. Cache keys include an audio digest and model/language configuration. Only a complete track is installed; stopping never displays a partial track. Completed output can be exported as SRT, including translated captions. Models are pinned: whisper-tiny 5332fcc35e32a33b86612b9a57a89be7906102b1 and whisper-base 64da57285918e20ea79ea5c88eed7197933abaa8. Larger model is optional and not a guarantee of accurate dialogue. Local audio/video decoding remains limited to browser-supported formats, 100 MB and 45 minutes. This does not capture remote HLS/iframe audio automatically.

Recognition API reference: https://huggingface.co/docs/transformers.js/v2.17.2/en/api/pipelines . No paid translation service or new user account was created.

Live checks: the complete 26/130/52 indexes returned HTTP 200 from Supabase, including last pages. DonghuaStream returned 100 chapters in season two and 52 in season three. Dailymotion first showed a removed upload and then a connection error in the cloud browser; playback is not guaranteed there. Odysee returned a public MP4 for episode 208, with HTTP 206 video bytes and Access-Control-Allow-Origin *. Recognition tiny produced 3 timed cues for 33 seconds of sample audio; the downloaded SRT retained the final 30–33 second block. Whisper base also recognized an 11-second sample in the published browser. These samples do not validate full Japanese/Chinese episodes or mobile speed.
