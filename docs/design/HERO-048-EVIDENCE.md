# First-fold screenshot evidence

Original, unedited CI captures, not rendered illustrations or physical-phone tests.
Before:390px viewport, CI39288583462, feature0b62fd5 (full CI passed).
Final after:390/1440px viewports, CI39294131711,
exact feature6c94291d5130d27ff906f9e1d43ef24bfee6348f (full CI passed).
Mobile and desktop final captures were visually inspected before release.
The initial failed run39292907065 found a derived border color outside accepted
tokens;6c94291 uses ink-soft directly, without changing the audit.
