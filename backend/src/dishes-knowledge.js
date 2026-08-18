// ═══════════════════════════════════════════════════════════════
// Knowledge Base Masakan Indonesia
// Dipakai untuk keyword-matching sebelum request ke AI,
// sehingga AI mendapat HINT yang tepat dan hasil lebih akurat.
// ═══════════════════════════════════════════════════════════════

// Setiap dish memiliki:
//   signature : kata kunci bahan khas — makin banyak cocok makin tinggi skor
//   required  : minimal salah satu dari array ini HARUS ada (OR logic)
//   boost     : kata kunci yang jika ada menaikkan skor secara signifikan

const DISHES_KNOWLEDGE = [

  // ── NASI ────────────────────────────────────────────────────
  {
    nama: 'Nasi Kebuli',
    signature: ['kambing','domba','nasi','kapulaga','kurma','bawang bombai','kayu manis','cengkeh','pala','ghee','mentega','minyak samin','kaldu kambing'],
    required: [['kambing','domba']],
    boost: ['kapulaga','kurma','bawang bombai'],
  },
  {
    nama: 'Nasi Mandhi',
    signature: ['kambing','ayam','nasi','kapulaga','kayu manis','cengkeh','jinten','bawang bombai','tomat','kunyit'],
    required: [['kambing','ayam']],
    boost: ['jinten','kapulaga'],
  },
  {
    nama: 'Nasi Briyani',
    signature: ['beras','basmati','ayam','kambing','kapulaga','kayu manis','cengkeh','bawang merah goreng','yogurt','saffron','minyak samin'],
    required: [['beras','basmati','nasi']],
    boost: ['saffron','yogurt','kapulaga'],
  },
  {
    nama: 'Nasi Goreng',
    signature: ['nasi','kecap','telur','bawang putih','bawang merah','cabai','minyak'],
    required: [['nasi']],
    boost: ['kecap','telur'],
  },
  {
    nama: 'Nasi Uduk',
    signature: ['beras','nasi','santan','kelapa','serai','daun salam','daun pandan','bawang merah','bawang putih'],
    required: [['beras','nasi']],
    boost: ['santan','kelapa','serai'],
  },
  {
    nama: 'Nasi Kuning',
    signature: ['beras','nasi','kunyit','santan','kelapa','serai','daun salam','daun pandan'],
    required: [['beras','nasi']],
    boost: ['kunyit','santan','kelapa'],
  },
  {
    nama: 'Nasi Liwet',
    signature: ['beras','nasi','santan','kelapa','ikan','serai','daun salam','bawang merah','bawang putih','cabai'],
    required: [['beras','nasi']],
    boost: ['santan','kelapa','ikan'],
  },
  {
    nama: 'Nasi Lemak',
    signature: ['beras','nasi','santan','kelapa','teri','kacang tanah','telur','timun','sambal'],
    required: [['beras','nasi']],
    boost: ['santan','kelapa','teri'],
  },
  {
    nama: 'Nasi Bakar',
    signature: ['nasi','daun pisang','ayam','teri','kemangi','santan','cabai','bawang'],
    required: [['nasi']],
    boost: ['daun pisang','kemangi'],
  },
  {
    nama: 'Nasi Padang / Nasi Rames',
    signature: ['nasi','rendang','gulai','sambal','lauk','sayur'],
    required: [['nasi']],
    boost: ['rendang','gulai'],
  },

  // ── DAGING SAPI ─────────────────────────────────────────────
  {
    nama: 'Rendang',
    signature: ['daging sapi','sapi','santan','cabai merah','serai','lengkuas','jahe','kunyit','bawang merah','bawang putih','daun jeruk','daun kunyit'],
    required: [['daging sapi','sapi','daging']],
    boost: ['santan','cabai merah','lengkuas'],
  },
  {
    nama: 'Rawon',
    signature: ['daging sapi','sapi','kluwek','keluak','serai','daun salam','bawang merah','bawang putih','jahe','ketumbar'],
    required: [['daging sapi','sapi','daging']],
    boost: ['kluwek','keluak'],
  },
  {
    nama: 'Semur Daging',
    signature: ['daging sapi','sapi','kecap manis','bawang bombai','pala','cengkeh','kayu manis','tomat'],
    required: [['daging sapi','sapi','daging']],
    boost: ['kecap manis','bawang bombai','pala'],
  },
  {
    nama: 'Sop Buntut',
    signature: ['buntut','sapi','wortel','kentang','seledri','bawang bombai','bawang putih','pala'],
    required: [['buntut']],
    boost: ['buntut','wortel','kentang'],
  },
  {
    nama: 'Tongseng Sapi',
    signature: ['daging sapi','sapi','santan','kecap','kubis','tomat','cabai','bawang merah','bawang putih'],
    required: [['daging sapi','sapi','daging']],
    boost: ['kubis','santan','kecap'],
  },
  {
    nama: 'Bakso',
    signature: ['daging sapi giling','sapi giling','tepung tapioka','tepung','kaldu sapi','mie','bawang putih','garam'],
    required: [['daging sapi giling','sapi giling','daging giling']],
    boost: ['tepung tapioka','kaldu sapi'],
  },
  {
    nama: 'Empal Gepuk',
    signature: ['daging sapi','sapi','santan','kecap manis','gula merah','ketumbar','bawang putih'],
    required: [['daging sapi','sapi','daging']],
    boost: ['santan','ketumbar'],
  },

  // ── KAMBING ─────────────────────────────────────────────────
  {
    nama: 'Sate Kambing',
    signature: ['kambing','kecap manis','bawang merah','bawang putih','ketumbar','cabai','tomat','jeruk nipis'],
    required: [['kambing','domba']],
    boost: ['kecap manis','sate'],
  },
  {
    nama: 'Gulai Kambing',
    signature: ['kambing','santan','kunyit','cabai merah','serai','lengkuas','jahe','ketumbar','daun jeruk'],
    required: [['kambing','domba']],
    boost: ['santan','kunyit','cabai merah'],
  },
  {
    nama: 'Tongseng Kambing',
    signature: ['kambing','santan','kecap','kubis','tomat','cabai','bawang merah','bawang putih'],
    required: [['kambing','domba']],
    boost: ['kubis','santan'],
  },
  {
    nama: 'Tengkleng Kambing',
    signature: ['tulang kambing','kambing','santan','kunyit','serai','jahe','ketumbar','bawang merah'],
    required: [['kambing','domba','tulang kambing']],
    boost: ['tulang','santan'],
  },

  // ── AYAM ────────────────────────────────────────────────────
  {
    nama: 'Ayam Goreng',
    signature: ['ayam','bawang putih','kunyit','ketumbar','jahe','garam','minyak'],
    required: [['ayam']],
    boost: ['kunyit','ketumbar'],
  },
  {
    nama: 'Opor Ayam',
    signature: ['ayam','santan','kunyit','serai','daun salam','daun jeruk','ketumbar','kemiri','bawang merah','bawang putih'],
    required: [['ayam']],
    boost: ['santan','daun salam','kemiri'],
  },
  {
    nama: 'Gulai Ayam',
    signature: ['ayam','santan','kunyit','cabai merah','serai','lengkuas','jahe','ketumbar'],
    required: [['ayam']],
    boost: ['santan','kunyit','cabai merah'],
  },
  {
    nama: 'Ayam Bakar',
    signature: ['ayam','kecap manis','bawang putih','cabai','jahe','kunyit'],
    required: [['ayam']],
    boost: ['kecap manis'],
  },
  {
    nama: 'Soto Ayam',
    signature: ['ayam','kunyit','serai','daun salam','bawang merah','bawang putih','jahe','mie','telur','tauge'],
    required: [['ayam']],
    boost: ['kunyit','serai','tauge'],
  },
  {
    nama: 'Ayam Betutu',
    signature: ['ayam','serai','daun salam','jahe','lengkuas','kunyit','cabai','daun jeruk','kemiri'],
    required: [['ayam']],
    boost: ['serai','lengkuas','kemiri'],
  },
  {
    nama: 'Kari Ayam',
    signature: ['ayam','santan','kunyit','ketumbar','jinten','cabai','bawang','kentang'],
    required: [['ayam']],
    boost: ['jinten','kentang','kari'],
  },
  {
    nama: 'Bubur Ayam',
    signature: ['beras','ayam','kaldu','jahe','seledri','bawang goreng','kecap'],
    required: [['beras','bubur']],
    boost: ['kaldu','jahe','seledri'],
  },

  // ── IKAN & SEAFOOD ───────────────────────────────────────────
  {
    nama: 'Ikan Bakar',
    signature: ['ikan','kecap manis','cabai','bawang putih','jahe','jeruk nipis','kunyit'],
    required: [['ikan']],
    boost: ['kecap manis','jeruk nipis'],
  },
  {
    nama: 'Pepes Ikan',
    signature: ['ikan','daun pisang','kunyit','cabai','kemangi','bawang merah','bawang putih','tomat'],
    required: [['ikan']],
    boost: ['daun pisang','kemangi'],
  },
  {
    nama: 'Ikan Asam Pedas',
    signature: ['ikan','asam jawa','cabai','tomat','serai','bawang merah','bawang putih','kunyit'],
    required: [['ikan']],
    boost: ['asam jawa','tomat'],
  },
  {
    nama: 'Pempek',
    signature: ['ikan tenggiri','tepung sagu','telur','bawang putih','garam','cuka','gula merah','ebi'],
    required: [['ikan tenggiri','tenggiri','ikan']],
    boost: ['tepung sagu','cuka','ebi'],
  },
  {
    nama: 'Papeda',
    signature: ['sagu','tepung sagu','ikan','kunyit','jahe','serai','daun jeruk'],
    required: [['sagu','tepung sagu']],
    boost: ['sagu','ikan'],
  },
  {
    nama: 'Udang Bakar',
    signature: ['udang','kecap manis','bawang putih','cabai','mentega','jeruk nipis'],
    required: [['udang']],
    boost: ['kecap manis','mentega'],
  },
  {
    nama: 'Cakalang Fufu',
    signature: ['ikan cakalang','cakalang','cabai','bawang','daun kemangi','minyak'],
    required: [['cakalang','ikan cakalang']],
    boost: ['cakalang'],
  },

  // ── SOTO & SUP ──────────────────────────────────────────────
  {
    nama: 'Soto Betawi',
    signature: ['daging sapi','sapi','santan','susu','kentang','tomat','bawang merah','bawang putih','serai','jahe'],
    required: [['daging sapi','sapi','jeroan']],
    boost: ['santan','susu','kentang'],
  },
  {
    nama: 'Coto Makassar',
    signature: ['daging sapi','sapi','jeroan','kacang tanah','serai','ketumbar','jinten','bawang merah','bawang putih','jahe','lengkuas'],
    required: [['daging sapi','sapi','jeroan']],
    boost: ['kacang tanah','jinten','ketumbar'],
  },
  {
    nama: 'Soto Madura',
    signature: ['ayam','sapi','kunyit','serai','bawang','kecap','perasan jeruk nipis','garam'],
    required: [['ayam','sapi','daging']],
    boost: ['kecap','jeruk nipis'],
  },
  {
    nama: 'Sayur Asem',
    signature: ['kacang tanah','jagung','kangkung','kacang panjang','labu','asam jawa','bawang merah','bawang putih'],
    required: [['asam jawa','asam']],
    boost: ['asam jawa','jagung','kangkung'],
  },

  // ── SAYUR ───────────────────────────────────────────────────
  {
    nama: 'Gudeg',
    signature: ['nangka muda','nangka','santan','gula merah','daun salam','serai','bawang merah','bawang putih','telur','ayam'],
    required: [['nangka muda','nangka']],
    boost: ['nangka muda','gula merah','santan'],
  },
  {
    nama: 'Lodeh',
    signature: ['labu siam','tempe','santan','buncis','terong','kacang panjang','kunyit','serai'],
    required: [['santan']],
    boost: ['labu siam','santan','tempe'],
  },
  {
    nama: 'Tumis Kangkung',
    signature: ['kangkung','bawang putih','cabai','terasi','garam','minyak'],
    required: [['kangkung']],
    boost: ['kangkung','terasi'],
  },
  {
    nama: 'Cap Cay',
    signature: ['wortel','kol','sawi','jagung muda','bakso','udang','saus tiram','telur','bawang putih'],
    required: [['saus tiram']],
    boost: ['saus tiram','wortel','kol'],
  },
  {
    nama: 'Pecel',
    signature: ['kacang tanah','bayam','tauge','kacang panjang','daun kemangi','gula merah','cabai','asam jawa'],
    required: [['kacang tanah']],
    boost: ['kacang tanah','tauge','bayam'],
  },
  {
    nama: 'Gado-gado',
    signature: ['kacang tanah','tahu','tempe','kentang','telur','tauge','bayam','lontong','mentimun'],
    required: [['kacang tanah']],
    boost: ['kacang tanah','tahu','tempe','lontong'],
  },

  // ── TAHU TEMPE TELUR ────────────────────────────────────────
  {
    nama: 'Tempe Mendoan',
    signature: ['tempe','tepung','cabai','kecap','bawang','daun bawang'],
    required: [['tempe']],
    boost: ['tepung','kecap'],
  },
  {
    nama: 'Oseng Tempe',
    signature: ['tempe','kecap manis','cabai','bawang putih','bawang merah','daun salam'],
    required: [['tempe']],
    boost: ['kecap manis'],
  },
  {
    nama: 'Tahu Bacem',
    signature: ['tahu','kecap manis','gula merah','bawang putih','ketumbar','daun salam','serai'],
    required: [['tahu']],
    boost: ['kecap manis','gula merah','ketumbar'],
  },
  {
    nama: 'Telur Balado',
    signature: ['telur','cabai merah','cabai','bawang merah','bawang putih','tomat','minyak'],
    required: [['telur']],
    boost: ['cabai merah','tomat'],
  },
  {
    nama: 'Telur Dadar',
    signature: ['telur','bawang','cabai','daun bawang','garam','minyak'],
    required: [['telur']],
    boost: ['daun bawang'],
  },
  {
    nama: 'Perkedel Kentang',
    signature: ['kentang','daging giling','telur','bawang goreng','daun bawang','merica','pala'],
    required: [['kentang']],
    boost: ['kentang','daging giling','bawang goreng'],
  },

  // ── MIE ─────────────────────────────────────────────────────
  {
    nama: 'Mie Goreng',
    signature: ['mie','kecap manis','telur','bawang putih','sawi','tomat','cabai'],
    required: [['mie']],
    boost: ['kecap manis','telur'],
  },
  {
    nama: 'Mie Ayam',
    signature: ['mie','ayam','bakso','kecap asin','sawi','bawang goreng','kaldu'],
    required: [['mie','ayam']],
    boost: ['kaldu','kecap asin'],
  },
  {
    nama: 'Mie Aceh',
    signature: ['mie','daging sapi','seafood','cabai merah','bawang bombai','rempah aceh','jinten','kapulaga'],
    required: [['mie']],
    boost: ['jinten','kapulaga','bawang bombai'],
  },
  {
    nama: 'Mie Rebus',
    signature: ['mie','kaldu','telur','sawi','bawang goreng','kecap','tomat'],
    required: [['mie']],
    boost: ['kaldu'],
  },
  {
    nama: 'Kwetiau Goreng',
    signature: ['kwetiau','kecap','daging sapi','telur','tauge','sawi','bawang putih','saus tiram'],
    required: [['kwetiau']],
    boost: ['kwetiau','saus tiram'],
  },
  {
    nama: 'Laksa',
    signature: ['santan','ikan','udang','bihun','serai','kunyit','cabai','daun kesum'],
    required: [['santan']],
    boost: ['santan','bihun','daun kesum'],
  },

  // ── SATE ────────────────────────────────────────────────────
  {
    nama: 'Sate Ayam',
    signature: ['ayam','kecap manis','kacang tanah','bawang merah','bawang putih','cabai','jeruk nipis'],
    required: [['ayam']],
    boost: ['kecap manis','kacang tanah'],
  },
  {
    nama: 'Sate Lilit',
    signature: ['ikan','kelapa parut','serai','cabai','daun jeruk','bawang putih','kemiri'],
    required: [['ikan','daging']],
    boost: ['kelapa parut','serai','kemiri'],
  },
  {
    nama: 'Sate Padang',
    signature: ['daging sapi','sapi','jeroan','kunyit','jahe','serai','tepung beras','ketumbar'],
    required: [['daging sapi','sapi','jeroan']],
    boost: ['tepung beras','ketumbar'],
  },

  // ── CAMILAN & GORENGAN ──────────────────────────────────────
  {
    nama: 'Martabak Telur',
    signature: ['telur','daging giling','bawang daun','bawang bombai','tepung','minyak'],
    required: [['telur','daging giling']],
    boost: ['bawang daun','tepung'],
  },
  {
    nama: 'Martabak Manis',
    signature: ['tepung','telur','susu','gula','mentega','coklat','keju','kacang','mesis'],
    required: [['tepung']],
    boost: ['mesis','keju','coklat'],
  },
  {
    nama: 'Risoles',
    signature: ['tepung','telur','susu','daging giling','wortel','kentang','mentega','tepung panir'],
    required: [['tepung','telur']],
    boost: ['tepung panir','wortel'],
  },
  {
    nama: 'Kroket',
    signature: ['kentang','daging giling','bawang','tepung panir','telur','mentega'],
    required: [['kentang','daging giling']],
    boost: ['tepung panir','kentang'],
  },
  {
    nama: 'Bakwan',
    signature: ['tepung','wortel','kol','daun bawang','telur','bawang putih','garam'],
    required: [['tepung']],
    boost: ['wortel','kol','daun bawang'],
  },
  {
    nama: 'Tempe Goreng',
    signature: ['tempe','tepung','bawang putih','ketumbar','kunyit','garam'],
    required: [['tempe','tepung']],
    boost: ['tempe','tepung'],
  },

  // ── KUE TRADISIONAL ─────────────────────────────────────────
  {
    nama: 'Klepon',
    signature: ['tepung ketan','gula merah','kelapa parut','daun pandan','garam'],
    required: [['tepung ketan']],
    boost: ['gula merah','kelapa parut','pandan'],
  },
  {
    nama: 'Onde-onde',
    signature: ['tepung ketan','kacang hijau','wijen','gula','santan'],
    required: [['tepung ketan']],
    boost: ['wijen','kacang hijau'],
  },
  {
    nama: 'Kue Lapis',
    signature: ['tepung beras','santan','gula','pewarna','garam','daun pandan'],
    required: [['tepung beras','santan']],
    boost: ['pewarna','santan'],
  },
  {
    nama: 'Serabi',
    signature: ['tepung beras','santan','gula','telur','daun pandan','garam'],
    required: [['tepung beras','santan']],
    boost: ['daun pandan'],
  },
  {
    nama: 'Kolak',
    signature: ['pisang','ubi','santan','gula merah','daun pandan','garam'],
    required: [['santan','gula merah']],
    boost: ['pisang','ubi','daun pandan'],
  },

  // ── KUE & ROTI MODERN ───────────────────────────────────────
  {
    nama: 'Brownies',
    signature: ['coklat','mentega','telur','tepung','gula','coklat bubuk'],
    required: [['coklat']],
    boost: ['coklat','mentega','tepung'],
  },
  {
    nama: 'Bolu Kukus',
    signature: ['tepung','telur','gula','mentega','susu','baking powder'],
    required: [['tepung','telur','gula']],
    boost: ['baking powder','mentega'],
  },
  {
    nama: 'Donat',
    signature: ['tepung','ragi','telur','gula','susu','mentega','minyak'],
    required: [['tepung','ragi']],
    boost: ['ragi','mentega'],
  },
  {
    nama: 'Nastar',
    signature: ['tepung','mentega','telur','gula halus','selai nanas','nanas'],
    required: [['tepung','mentega']],
    boost: ['nanas','selai nanas'],
  },

  // ── DESSERT ─────────────────────────────────────────────────
  {
    nama: 'Es Teler',
    signature: ['alpukat','kelapa muda','cincau','susu kental manis','sirup','es'],
    required: [['alpukat','kelapa muda']],
    boost: ['cincau','susu kental manis','kelapa muda'],
  },
  {
    nama: 'Es Alpukat',
    signature: ['alpukat','susu','gula','es','coklat','sirup'],
    required: [['alpukat']],
    boost: ['susu','gula','es'],
  },
  {
    nama: 'Es Buah',
    signature: ['melon','semangka','nanas','kelapa muda','agar','susu kental manis','sirup'],
    required: [['melon','semangka','nanas','buah']],
    boost: ['sirup','susu kental manis'],
  },
  {
    nama: 'Puding',
    signature: ['agar','agar-agar','susu','gula','telur','santan','vanili'],
    required: [['agar','agar-agar']],
    boost: ['susu','agar','vanili'],
  },

  // ── MINUMAN TRADISIONAL ─────────────────────────────────────
  {
    nama: 'Wedang Jahe',
    signature: ['jahe','gula merah','gula jawa','serai','daun pandan','air'],
    required: [['jahe']],
    boost: ['gula merah','serai'],
  },
  {
    nama: 'Bajigur',
    signature: ['santan','jahe','gula merah','kopi','kolang-kaling','daun pandan'],
    required: [['santan','jahe']],
    boost: ['gula merah','kopi','kolang-kaling'],
  },
  {
    nama: 'Sekoteng',
    signature: ['kacang hijau','jahe','santan','gula','kolang-kaling','biji delima'],
    required: [['kacang hijau','jahe']],
    boost: ['gula','jahe'],
  },
  {
    nama: 'Jamu Kunyit Asam',
    signature: ['kunyit','asam jawa','gula merah','garam','air'],
    required: [['kunyit','asam jawa']],
    boost: ['asam jawa','kunyit'],
  },

  // ── KOPI ────────────────────────────────────────────────────
  {
    nama: 'Kopi Susu',
    signature: ['kopi','susu','gula','air panas'],
    required: [['kopi']],
    boost: ['susu'],
  },
  {
    nama: 'Es Kopi Susu',
    signature: ['kopi','susu','gula','es batu','krim'],
    required: [['kopi']],
    boost: ['es','es batu'],
  },
  {
    nama: 'Kopi Tubruk',
    signature: ['kopi','gula','air panas'],
    required: [['kopi']],
    boost: ['kopi'],
  },
  {
    nama: 'Dalgona Coffee',
    signature: ['kopi instan','gula','air','susu','es'],
    required: [['kopi instan','kopi']],
    boost: ['gula','susu'],
  },

  // ── TEH & MINUMAN SEGAR ─────────────────────────────────────
  {
    nama: 'Teh Tarik',
    signature: ['teh','susu kental manis','gula','air panas'],
    required: [['teh']],
    boost: ['susu kental manis'],
  },
  {
    nama: 'Es Teh Manis',
    signature: ['teh','gula','es','air'],
    required: [['teh']],
    boost: ['es','gula'],
  },
  {
    nama: 'Jus Alpukat',
    signature: ['alpukat','susu','gula','es'],
    required: [['alpukat']],
    boost: ['susu'],
  },
  {
    nama: 'Jus Mangga',
    signature: ['mangga','air','gula','jeruk nipis','es'],
    required: [['mangga']],
    boost: ['gula','jeruk nipis'],
  },
  {
    nama: 'Es Jeruk',
    signature: ['jeruk','gula','air','es'],
    required: [['jeruk']],
    boost: ['gula','es'],
  },

  // ── BUBUR & SARAPAN ─────────────────────────────────────────
  {
    nama: 'Bubur Kacang Hijau',
    signature: ['kacang hijau','santan','gula merah','jahe','daun pandan'],
    required: [['kacang hijau']],
    boost: ['santan','gula merah'],
  },
  {
    nama: 'Bubur Sumsum',
    signature: ['tepung beras','santan','gula merah','daun pandan','garam'],
    required: [['tepung beras','santan']],
    boost: ['gula merah','daun pandan'],
  },
  {
    nama: 'Lontong Sayur',
    signature: ['lontong','labu siam','buncis','santan','serai','kunyit','udang'],
    required: [['lontong']],
    boost: ['labu siam','santan'],
  },

  // ── KHAS DAERAH ─────────────────────────────────────────────
  {
    nama: 'Pindang Meranjat',
    signature: ['ikan patin','patin','asam jawa','tomat','cabai','serai','kunyit','belimbing wuluh'],
    required: [['ikan patin','patin','ikan']],
    boost: ['belimbing wuluh','asam jawa'],
  },
  {
    nama: 'Tinutuan',
    signature: ['beras','labu kuning','jagung','bayam','kangkung','ubi','santan'],
    required: [['beras','jagung']],
    boost: ['labu kuning','kangkung'],
  },
  {
    nama: 'Pallubasa',
    signature: ['jeroan sapi','sapi','kelapa gongseng','serai','jahe','bawang merah','bawang putih','ketumbar'],
    required: [['jeroan','sapi','daging']],
    boost: ['kelapa gongseng'],
  },

  // ── BEBEK ───────────────────────────────────────────────────
  {
    nama: 'Bebek Goreng',
    signature: ['bebek','bawang putih','ketumbar','kunyit','jahe','serai','garam','minyak'],
    required: [['bebek']],
    boost: ['bebek','ketumbar'],
  },
  {
    nama: 'Bebek Bakar',
    signature: ['bebek','kecap manis','kecap','bawang','jahe','kunyit','serai'],
    required: [['bebek']],
    boost: ['bebek','kecap'],
  },
  {
    nama: 'Bebek Betutu',
    signature: ['bebek','serai','kunyit','lengkuas','cabai','daun jeruk','kemiri','jahe'],
    required: [['bebek']],
    boost: ['serai','lengkuas','kemiri'],
  },
  {
    nama: 'Rica-Rica Bebek',
    signature: ['bebek','cabai','jahe','serai','daun jeruk','bawang merah','bawang putih'],
    required: [['bebek']],
    boost: ['cabai','daun jeruk'],
  },

  // ── OLAHAN KELAPA ───────────────────────────────────────────
  {
    nama: 'Urap Sayur',
    signature: ['kelapa parut','kelapa','bayam','tauge','kacang panjang','cabai','kencur','daun jeruk'],
    required: [['kelapa']],
    boost: ['kelapa parut','tauge','bayam'],
  },
  {
    nama: 'Serundeng',
    signature: ['kelapa parut','kelapa','gula merah','ketumbar','daun salam','lengkuas','bawang'],
    required: [['kelapa']],
    boost: ['kelapa parut','gula merah'],
  },
  {
    nama: 'Botok',
    signature: ['kelapa parut','kelapa','tahu','tempe','teri','daun pisang','cabai','kemangi'],
    required: [['kelapa']],
    boost: ['daun pisang','teri','tempe'],
  },
  {
    nama: 'Dadar Gulung',
    signature: ['tepung','kelapa parut','kelapa','gula merah','santan','daun pandan','telur'],
    required: [['tepung','kelapa']],
    boost: ['gula merah','daun pandan'],
  },
  {
    nama: 'Wingko Babat',
    signature: ['kelapa parut','kelapa','tepung ketan','gula','santan'],
    required: [['kelapa']],
    boost: ['tepung ketan','kelapa parut'],
  },
  {
    nama: 'Klappertaart',
    signature: ['kelapa muda','kelapa','susu','tepung','telur','mentega','kismis','kenari'],
    required: [['kelapa']],
    boost: ['susu','kismis','kenari'],
  },
  {
    nama: 'Kerak Telor',
    signature: ['beras ketan','ketan','telur','kelapa','ebi','bawang goreng'],
    required: [['telur']],
    boost: ['kelapa','ketan','ebi'],
  },

  // ── ES & MINUMAN KELAPA ─────────────────────────────────────
  {
    nama: 'Es Kelapa Muda',
    signature: ['kelapa muda','kelapa','es batu','es','gula','sirup','air','jeruk nipis'],
    required: [['kelapa']],
    boost: ['es','es batu','kelapa'],
  },
  {
    nama: 'Es Campur',
    signature: ['es','es batu','sirup','susu kental manis','susu','kelapa muda','kelapa','cincau','alpukat','nangka','agar'],
    required: [['es','es batu']],
    boost: ['sirup','susu kental manis','cincau'],
  },
  {
    nama: 'Es Doger',
    signature: ['es','es batu','kelapa muda','kelapa','tape','ketan hitam','susu kental manis','susu','sirup','alpukat'],
    required: [['es','es batu']],
    boost: ['tape','kelapa muda','ketan hitam'],
  },
  {
    nama: 'Es Cendol',
    signature: ['cendol','santan','kelapa','gula merah','es','es batu','daun pandan','tepung beras'],
    required: [['santan','kelapa','cendol']],
    boost: ['gula merah','cendol'],
  },
  {
    nama: 'Es Kopyor',
    signature: ['kelapa kopyor','kelapa','sirup','es','es batu','susu kental manis','susu'],
    required: [['kelapa']],
    boost: ['sirup','es'],
  },

  // ── MASAKAN SEDERHANA UMUM ──────────────────────────────────
  {
    nama: 'Sop Ayam',
    signature: ['ayam','wortel','kentang','seledri','bawang merah','bawang putih','merica','air'],
    required: [['ayam']],
    boost: ['wortel','kentang','seledri'],
  },
  {
    nama: 'Sayur Bening Bayam',
    signature: ['bayam','jagung','temu kunci','gula','bawang merah','air'],
    required: [['bayam']],
    boost: ['temu kunci','jagung'],
  },
  {
    nama: 'Rujak Buah',
    signature: ['mangga','nanas','timun','jambu','kedondong','bengkuang','gula merah','cabai','asam','kacang tanah'],
    required: [['mangga','nanas','timun','jambu','kedondong','bengkuang']],
    boost: ['gula merah','cabai'],
  },
  {
    nama: 'Pisang Goreng',
    signature: ['pisang','tepung','gula','garam','minyak'],
    required: [['pisang']],
    boost: ['tepung'],
  },
  {
    nama: 'Singkong Goreng',
    signature: ['singkong','bawang putih','ketumbar','garam','minyak'],
    required: [['singkong']],
    boost: ['singkong'],
  },
  {
    nama: 'Jagung Bakar',
    signature: ['jagung','mentega','margarin','keju','susu kental manis','cabai','kecap'],
    required: [['jagung']],
    boost: ['mentega','keju'],
  },
  {
    nama: 'Ubi Rebus',
    signature: ['ubi','air','garam','kelapa parut','kelapa'],
    required: [['ubi']],
    boost: ['ubi'],
  },
  {
    nama: 'Ketan Kelapa',
    signature: ['ketan','beras ketan','kelapa parut','kelapa','gula','garam','santan'],
    required: [['ketan']],
    boost: ['kelapa','gula'],
  },

]

// ── Fungsi Matching ───────────────────────────────────────────
// Normalisasi teks: lowercase + hapus tanda baca
function normalize(str) {
  return str.toLowerCase().trim()
}

// Cek apakah keyword ada di dalam list bahan user
function ingredientMatches(keyword, bahanUser) {
  const kw = normalize(keyword)
  return bahanUser.some((b) => {
    const bn = normalize(b)
    return bn.includes(kw) || kw.includes(bn)
  })
}

/**
 * Cari masakan yang paling cocok dari knowledge base
 * @param {string[]} bahanUser - daftar bahan dari user
 * @param {number} topN - jumlah hasil yang dikembalikan
 * @param {number} minScore - ambang skor minimal (default 0.15)
 * @returns {{ nama: string, score: number, matchedIngredients: string[] }[]}
 */
function findMatchingDishes(bahanUser, topN = 5, minScore = 0.15) {
  const results = []

  for (const dish of DISHES_KNOWLEDGE) {
    // Cek required (setidaknya 1 group required harus terpenuhi)
    if (dish.required && dish.required.length > 0) {
      const requiredMet = dish.required.every((group) =>
        group.some((kw) => ingredientMatches(kw, bahanUser))
      )
      if (!requiredMet) continue
    }

    // Hitung berapa signature ingredients yang cocok
    const matched = dish.signature.filter((kw) => ingredientMatches(kw, bahanUser))
    if (matched.length === 0) continue

    // Hitung boost (bahan khas yang meningkatkan skor)
    const boostCount = (dish.boost || []).filter((kw) => ingredientMatches(kw, bahanUser)).length

    // Score = (matched / total_signature) + boost bonus
    const baseScore = matched.length / dish.signature.length
    const boostScore = boostCount * 0.15
    const score = Math.min(baseScore + boostScore, 1.0)

    if (score >= minScore) {
      results.push({ nama: dish.nama, score, matchedIngredients: matched })
    }
  }

  // Urutkan dari skor tertinggi
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, topN)
}

/**
 * Cek apakah nama saran menyebut masakan yang dikenal tapi bahan wajibnya
 * tidak dimiliki user (mis. "Gudeg Ayam" padahal tidak ada nangka).
 * @returns {string|null} nama masakan yang dilanggar, atau null jika aman
 */
function dishRequirementViolated(namaSaran, bahanUser) {
  const t = normalize(namaSaran || '')
  for (const dish of DISHES_KNOWLEDGE) {
    const dn = normalize(dish.nama)
    if (!t.includes(dn)) continue
    if (!dish.required || dish.required.length === 0) continue
    const met = dish.required.every((group) =>
      group.some((kw) => ingredientMatches(kw, bahanUser))
    )
    if (!met) return dish.nama
  }
  return null
}

// ── Whitelist nama hidangan nyata ─────────────────────────────
// Gabungan knowledge base + 390 nama dari daftar inspirasi (dish-names.js).
// Saran AI yang namanya tidak cocok dengan satu pun nama di sini dianggap
// mengarang (halusinasi) dan ditolak.
let KNOWN_DISH_NAMES = null
function isKnownDish(nama) {
  if (!KNOWN_DISH_NAMES) {
    let extra = []
    try { extra = require('./dish-names').DISH_NAMES } catch { /* opsional */ }
    KNOWN_DISH_NAMES = [...DISHES_KNOWLEDGE.map((d) => d.nama), ...extra].map(normalize)
  }
  const n = normalize(nama || '')
  if (n.length < 4) return false
  return KNOWN_DISH_NAMES.some((k) => k.includes(n) || n.includes(k))
}

module.exports = { findMatchingDishes, dishRequirementViolated, isKnownDish }
