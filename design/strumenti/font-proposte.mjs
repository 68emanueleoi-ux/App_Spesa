// Le dieci proposte di carattere per Mastro (giro 4), condivise con la pagina dei colori.
// I percorsi valgono per una pagina in design/proposte/<giro>/.
const F = '../../../node_modules'
const V = (pkg, file) => `${F}/@fontsource-variable/${pkg}/files/${file}`
const S = (pkg, file) => `${F}/@fontsource/${pkg}/files/${file}`

/*
  Ogni proposta: un carattere di carattere ("voce") per la cifra grande, i titoli e,
  quando regge il corpo piccolo, anche gli importi del registro; un carattere da
  testo tranquillo per tutto il resto. Due famiglie al massimo.
*/
export const PROPOSTE = [
  {
    nome: 'Moda', voce: 'Bodoni Moda', testo: 'Hanken Grotesk', tab: 'Hanken Grotesk',
    pesoVoce: 600, vsVoce: "'opsz' 96", tabPeso: 500,
    facce: [['Bodoni Moda', V('bodoni-moda', 'bodoni-moda-latin-opsz-normal.woff2')], ['Hanken Grotesk', V('hanken-grotesk', 'hanken-grotesk-latin-wght-normal.woff2')]],
    nota: 'Bodoni a contrasto altissimo: filetti sottili e aste piene, come le cifre sulle copertine di moda. Il registro sotto resta in un grottesco calmo.',
  },
  {
    nome: 'Cassa', voce: 'Doto', testo: 'Geist', tab: 'Doto', pesoVoce: 800, tabPeso: 700,
    facce: [['Doto', V('doto', 'doto-latin-wght-normal.woff2')], ['Geist', V('geist', 'geist-latin-wght-normal.woff2')]],
    nota: 'Cifre a matrice di punti, come il display del registratore di cassa o della bilancia del mercato. Gli importi del registro sono anche loro a punti.',
  },
  {
    nome: 'Macchina', voce: 'Xanh Mono', testo: 'Familjen Grotesk', tab: 'Xanh Mono', pesoVoce: 400, tabPeso: 400,
    facce: [['Xanh Mono', S('xanh-mono', 'xanh-mono-latin-400-normal.woff2'), 400], ['Familjen Grotesk', V('familjen-grotesk', 'familjen-grotesk-latin-wght-normal.woff2')]],
    nota: 'Un monospaziato con le grazie e un’aria un po’ storta, da macchina da scrivere vietnamita. Il registro diventa un vero libro battuto a macchina.',
  },
  {
    nome: 'Galleria', voce: 'Syne', testo: 'Syne', tab: 'Syne Mono', pesoVoce: 700, scalaCifra: 0.8, tabPeso: 400,
    facce: [['Syne', V('syne', 'syne-latin-wght-normal.woff2')], ['Syne Mono', S('syne-mono', 'syne-mono-latin-400-normal.woff2'), 400]],
    nota: 'Syne è nato per un centro d’arte parigino: largo e pesante nei neretti, stretto nei chiari. Gli importi in Syne Mono, il suo gemello.',
  },
  {
    nome: 'Largo', voce: 'Hubot Sans', testo: 'Mona Sans', tab: 'Mona Sans', pesoVoce: 800, larghezzaVoce: '125%', tabPeso: 500,
    facce: [['Hubot Sans', V('hubot-sans', 'hubot-sans-latin-standard-normal.woff2'), '200 900', 'font-stretch: 75% 125%;'], ['Mona Sans', V('mona-sans', 'mona-sans-latin-wght-normal.woff2')]],
    nota: 'La cifra stesa al massimo della larghezza (125%), pesante e piatta come una targa. Il resto in Mona Sans, che è della stessa famiglia.',
  },
  {
    nome: 'Antico', voce: 'Cormorant', testo: 'Geologica', tab: 'Cormorant', pesoVoce: 600, tabPeso: 600, tabCorpo: 17,
    facce: [['Cormorant', V('cormorant', 'cormorant-latin-wght-normal.woff2')], ['Geologica', V('geologica', 'geologica-latin-wght-normal.woff2')]],
    nota: 'Un Garamond da titolo, sottile ed elegante: il libro mastro di una bottega di una volta. Gli importi restano nel Garamond, un po’ più grandi.',
  },
  {
    nome: 'Tondo', voce: 'Unbounded', testo: 'Geist', tab: 'Geist', pesoVoce: 600, scalaCifra: 0.86, tabPeso: 500,
    facce: [['Unbounded', V('unbounded', 'unbounded-latin-wght-normal.woff2')], ['Geist', V('geist', 'geist-latin-wght-normal.woff2')]],
    nota: 'Largo e tondo, con le pance delle cifre piene: la cifra si legge da lontano e ha una faccia sua. Tutto il resto in Geist, neutro, così Unbounded resta l’unica voce forte.',
  },
  {
    nome: 'Pennarello', voce: 'Recursive', testo: 'Recursive', tab: 'Recursive', pesoVoce: 800, vsVoce: "'CASL' 1, 'MONO' 0, 'slnt' -15, 'CRSV' 1", vsTesto: "'CASL' 0, 'MONO' 0", vsTab: "'CASL' 1, 'MONO' 1", tabPeso: 600,
    facce: [['Recursive', V('recursive', 'recursive-latin-full-normal.woff2')]],
    nota: 'Recursive con l’asse "casual" al massimo, inclinato e con le forme corsive: la cifra sembra scritta a pennarello sul quaderno dei conti. Testo nella versione composta, importi nella versione monospaziata casual.',
  },
  {
    nome: 'Spigolo', voce: 'Piazzolla', testo: 'Spline Sans', tab: 'Piazzolla', pesoVoce: 700, vsVoce: "'opsz' 72", tabPeso: 500, vsTab: "'opsz' 14",
    facce: [['Piazzolla', V('piazzolla', 'piazzolla-latin-opsz-normal.woff2')], ['Spline Sans', V('spline-sans', 'spline-sans-latin-wght-normal.woff2')]],
    nota: 'Un serif dalle forme spigolose e intagliate, nato per i giornali: molto riconoscibile senza essere fragile ai corpi piccoli.',
  },
  {
    nome: 'Bottega', voce: 'Young Serif', testo: 'Instrument Sans', tab: 'Young Serif', pesoVoce: 400, tabPeso: 400,
    facce: [['Young Serif', S('young-serif', 'young-serif-latin-400-normal.woff2'), 400], ['Instrument Sans', V('instrument-sans', 'instrument-sans-latin-wght-normal.woff2')]],
    nota: 'Un serif grasso e rotondo, da insegna di bottega o da etichetta di marmellata: caldo, pieno, per niente "bancario".',
  },
]

