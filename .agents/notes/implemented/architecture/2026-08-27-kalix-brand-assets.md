# Agent Note: Kalix brand assets

Status: implemented

English | [中文](2026-08-27-kalix-brand-assets.zh.md)

## Problem

The repository exposed inherited product logos through public site assets, browser and PWA icons, embedded documentation images, and remote README images. Keeping those image sources alongside Kalix Code branding would make the visible product identity inconsistent and would leave documentation dependent on external hosts for its brand presentation.

## Decision

Kalix Code owns the product-facing artwork used by the web application, documentation site, README, documentation illustrations, and packaged skill badge. The supplied Kalix Code mascot becomes the browser, PWA, and documentation-site icon. The supplied Kalix Code lockup becomes the documentation-site navigation mark, README logo image, and skill badge source.

The web application serves `apps/web/public/kalix-code-mascot.png` and declares it from the browser document and PWA manifest. The documentation site serves `website/public/kalix-code-mascot.png` and `website/public/kalix-code-wordmark.png`. README image elements reference those repository-local files. The provider guide image files remain at their existing documentation paths so published links stay stable, but their contents are Kalix Code imagery.

Legacy favicon and wordmark files are absent. Product-facing image references do not load images from the inherited remote CDN. Test fixtures that use `example.com` image URLs to verify Markdown rendering remain neutral test data rather than product artwork.

## Alternatives considered

**Keeping legacy asset names and replacing only their file contents** would obscure the product identity inside source control and leave configuration suggesting an inherited visual system.

**Loading Kalix artwork from an external host** would add a network dependency to the project presentation and make local, offline, and forked documentation less reliable.

**Changing generic Markdown image fixtures** would alter behavior tests without replacing a product image. Their neutral URLs continue to establish URL handling independently of project branding.

## Consequences

The application and documentation presentation use repository-owned Kalix Code images, and browser and install metadata refer to the new mascot. The source tree carries a small set of raster brand assets that must remain consistent with the approved Kalix Code artwork.

The visual refresh deliberately does not rename source-package vocabulary, commands, configuration keys, or protocol identifiers. That repository-wide technical migration remains a separate decision.
