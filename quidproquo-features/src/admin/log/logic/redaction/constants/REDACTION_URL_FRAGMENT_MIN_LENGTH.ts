/**
 * The shortest run of URL-safe characters after a URL's `#` that urlFragmentParser treats as a
 * secret. Long enough that page anchors and app routes (`#top`, `#/items/<guid>`) aren't mistaken
 * for one; short enough for any real random token.
 */
export const REDACTION_URL_FRAGMENT_MIN_LENGTH = 32;
