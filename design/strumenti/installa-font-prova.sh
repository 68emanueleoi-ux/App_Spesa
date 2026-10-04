#!/usr/bin/env sh
# Installa tutti i font provati nei mockup del restyling, SENZA salvarli in package.json.
# Vanno installati sempre tutti insieme: ogni "npm install --no-save" toglie quelli
# installati prima nello stesso modo, e anche un normale "npm install" li rimuove.
# Uso, dalla cartella del progetto:  sh design/strumenti/installa-font-prova.sh
V=@fontsource-variable
S=@fontsource
npm install --no-save --no-audit --no-fund \
  $V/instrument-sans $V/schibsted-grotesk $V/hanken-grotesk $V/fraunces $V/newsreader $V/ibm-plex-sans $S/ibm-plex-mono \
  $V/jetbrains-mono $V/recursive $V/figtree $V/onest $V/source-serif-4 $V/public-sans $V/work-sans $V/archivo $V/mona-sans \
  $V/hubot-sans $V/funnel-display $V/funnel-sans $V/host-grotesk $V/geologica $V/red-hat-display $V/red-hat-text $V/red-hat-mono \
  $V/albert-sans $V/libre-franklin $S/instrument-serif $V/literata $S/young-serif $V/martian-mono $V/commissioner $V/epilogue \
  $S/space-mono $V/gabarito $V/bodoni-moda $V/spline-sans-mono $V/reddit-sans $V/reddit-mono $V/geist $V/geist-mono $V/dm-sans \
  $S/dm-mono $V/inconsolata $V/sometype-mono $V/azeret-mono $S/fragment-mono $V/syne $V/unbounded $V/doto $V/handjet $S/xanh-mono \
  $V/piazzolla $V/petrona $S/gloock $V/eb-garamond $S/libre-caslon-text $V/cormorant $V/familjen-grotesk $V/anybody $V/kode-mono \
  $S/syne-mono $V/darker-grotesque $V/workbench $V/sixtyfour $S/dm-serif-display $V/gelasio $V/roboto-serif $S/redaction \
  $V/rethink-sans $V/wix-madefor-display $V/tilt-warp $V/afacad-flux $V/radio-canada-big $V/gantari $S/ibm-plex-serif $V/spline-sans \
  $V/playfair-display $V/libre-bodoni $V/chivo-mono $V/tektur $V/oxanium $V/saira $S/dela-gothic-one $S/rubik-mono-one \
  $S/major-mono-display $S/abril-fatface $S/rozha-one $S/chakra-petch $S/bowlby-one $S/archivo-black $V/big-shoulders-display \
  $V/climate-crisis $S/ultra \
  $V/brygada-1918 $V/besley $V/crimson-pro $V/alegreya $V/bitter $V/faustina $V/grenze $V/texturina $V/stix-two-text $V/noto-serif-display $V/hahmlet $V/imbue $V/lexend-zetta $V/lexend-exa $V/league-spartan $V/exo-2 $V/victor-mono $V/overpass-mono $V/pixelify-sans $V/stick-no-bills $V/orbitron $V/readex-pro $V/sora $V/bitcount-prop-single $V/bitcount-grid-double \
  $S/spectral $S/alegreya-sans $S/zilla-slab $S/inknut-antiqua $S/castoro $S/cardo $S/old-standard-tt $S/bona-nova $S/fanwood-text $S/sorts-mill-goudy $S/krona-one $S/michroma $S/bungee $S/lilita-one $S/titan-one $S/rammetto-one $S/chango $S/gasoek-one $S/bagel-fat-one $S/righteous $S/b612 $S/b612-mono $S/courier-prime $S/cutive-mono $S/share-tech-mono $S/vt323 $S/silkscreen $S/jersey-10 $S/tiny5 $S/allerta-stencil $S/saira-stencil-one $S/wallpoet $S/quantico $S/electrolize $S/turret-road $S/aldrich $S/nova-mono $S/anonymous-pro $S/bai-jamjuree $S/gothic-a1 $S/jacquard-24 $S/micro-5 $S/sedan
