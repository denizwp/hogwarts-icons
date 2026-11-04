(function () {
  var BASE = 'https://cdn.tools.deniz.cyou/';
  var REPO = 'https://github.com/denizwp/hogwarts-icons';
  var URL_LIMIT = 8000;
  var JSON_LIMIT = 60000;
  var NAME_LIMIT = 120;
  // The site shows this folder only. The CDN holds other folders too; their direct URLs keep working.
  var ROOT = 'icons';
  var TRANSLATABLE_EXT = /\.webp$/;
  var CHUNK = 240;
  var STORE_LANG = 'hogwarts-icons.lang';
  var STORE_DRAFTS = 'hogwarts-icons.drafts';

  // Used only when names/languages.json cannot be read.
  var DEFAULT_LANGUAGES = { en: 'English', tr: 'Türkçe' };

  // Languages a person may propose. names/languages.json decides which are open:
  // anything else can be drafted here, but submitting needs the owner to add it first.
  var PROPOSABLE = {
    ar: 'العربية', bg: 'Български', da: 'Dansk', el: 'Ελληνικά', fi: 'Suomi', he: 'עברית', hu: 'Magyar', id: 'Bahasa Indonesia',
    lt: 'Lietuvių', no: 'Norsk', 'pt-PT': 'Português (Portugal)', ro: 'Română', sk: 'Slovenčina', sv: 'Svenska', th: 'ไทย', vi: 'Tiếng Việt'
  };

  // Interface text. en is complete; any key or language missing here shows in English.
  var UI = {
    en: {
      title: 'Icon Catalog',
      search: 'Search: absinthe, dittany, wand…', searchLabel: 'Search icons',
      folders: 'Folders', all: 'All', icon: '{n} icon', icons: '{n} icons', none: 'No results.', allDone: 'Everything here has a name.',
      failed: 'Could not load the icon list. Check your connection and reload the page.',
      skip: 'Skip to icons', contact: 'Contact me:', language: 'Language',
      copy: 'Copy', copied: 'Copied', url: 'URL', path: 'Path', name: 'Name', openTab: 'Open in new tab', prev: 'Previous', next: 'Next', close: 'Close',
      untranslated: 'untranslated', coverage: '{lang}: {pct} translated', notOpenTag: 'not open yet',
      translate: 'Translate', addIcon: 'Add an icon',
      footNote: 'Unofficial fan project, not affiliated with Warner Bros. Games, Avalanche Software or Portkey Games.',
      footShort: 'Unofficial fan project', footRights: 'Image rights', footContributing: 'Contributing', footRepo: 'GitHub',
      translating: 'Translating into {lang}', progress: '{done} of {total} named ({pct})',
      draftsSaved: '{n} drafts saved in this browser', draftSaved: '1 draft saved in this browser',
      draftsVolatile: 'Drafts only in this tab: {n}. This browser is not saving them, so submit before you close it.',
      onlyUntranslated: 'Untranslated only', newLanguage: 'Start a new language…', newLanguageLabel: 'Start a new language', submit: 'Submit', submitCount: 'Submit {n}', done: 'Done',
      notOpenBar: '{lang} is not open yet. You can draft here, and submitting needs the language added first.',
      folderName: 'Folder name', draftTag: 'draft', previewKey: 'Alt+Enter: large preview', nameFor: 'Name for {source}, {path}',
      errLong: 'Keep it to 120 characters or fewer.', errAngle: 'Remove < and >.', errEntity: 'Write the character itself instead of an HTML entity such as &amp;.', errUrl: 'Remove the web address (://).',
      errControl: 'Remove the line breaks and control characters.', errBidi: 'Remove the text direction override characters.',
      sendTitle: 'Submit translation', sendSummary: '{n} names in {lang}.', sendSummaryOne: '1 name in {lang}.', sendNothing: 'Nothing to submit yet. Type a name into any icon first.',
      sendStale: 'Left out: {n}. Those icons are no longer in the catalog.',
      sendProblems: 'Fix these before you submit:', sendShow: 'Show', sendOffPage: 'This icon is on the main catalog page.',
      sendOpen: 'Open the prefilled issue on GitHub',
      sendLong: 'This is too long for a link. Copy it, open the issue, then paste it into the "Translation data" field.', sendCopyOpen: 'Copy and open GitHub',
      sendParts: 'This is too long for one issue, so it is split into {n} parts. Submit each one as its own issue. Each becomes its own pull request.',
      sendPart: 'Part {i} of {n}: {count} names', sendPartLink: 'Open prefilled issue', sendData: 'Translation data', sendCopy: 'Copy',
      sendNeeds: 'You need a GitHub account. On GitHub, tick the terms box and submit the issue.',
      sendNext: 'A check replies on the issue. If the names pass, it opens a pull request for the owner to review. If not, it lists the problems, and editing the issue runs it again.',
      sendKeep: 'Keep your drafts until the names are published. They clear themselves once they match.',
      sendNotOpen: '{lang} is not open yet, so GitHub would refuse these names. Adding a language is a pull request the owner reviews. Add this line to names/languages.json, then come back and submit: your drafts stay here.',
      sendLine: 'Line to add', sendEdit: 'Edit names/languages.json on GitHub',
      discard: 'Discard these drafts', discardSure: 'Discard for good ({n})',
      helpTitle: 'Contribute',
      helpTranslateTitle: 'Translate the names',
      helpTranslate: 'Icon names can be shown in any language we open. Switch to translate mode, type names right on the icons and submit them when you are ready. Your drafts stay in this browser until then. You need a GitHub account to submit.',
      helpTranslateGo: 'Start translating',
      helpIconTitle: 'Add an icon',
      helpIcon: 'Icons are added by pull request, and the owner reviews every one.',
      helpIconSteps: ['Fork the repository and create a branch.', 'Add .webp files in the folder under icons/ that fits. Most icons belong in icons/items/.', 'Open a pull request and fill in the template.'],
      helpIconTerms: 'Say where each file comes from: made by you, from the game or from a mod, and whether an AI tool made any of it. Size limits and naming rules are in CONTRIBUTING.md.',
      helpIconGo: 'Read CONTRIBUTING.md', helpRepo: 'Open the repository',
      helpRightsTitle: 'Rights',
      helpRights: 'This is an unofficial fan project, not affiliated with or endorsed by Warner Bros. Games, Avalanche Software, Portkey Games or Wizarding World. Harry Potter and related names and marks belong to their owners. The code is MIT licensed, the images are not: ASSETS.md says what each group is and how you may use it.',
      helpRightsGo: 'Read ASSETS.md'
    },
    tr: {
      title: 'İkon Kataloğu',
      search: 'Ara: absent, anahtar, dittany…', searchLabel: 'İkon ara',
      folders: 'Klasörler', all: 'Tümü', icon: '{n} ikon', icons: '{n} ikon', none: 'Sonuç yok.', allDone: 'Buradaki her ikonun adı var.',
      failed: 'İkon listesi yüklenemedi. Bağlantını kontrol edip sayfayı yenile.',
      skip: 'İkonlara geç', contact: 'Bana ulaş:', language: 'Dil',
      copy: 'Kopyala', copied: 'Kopyalandı', url: 'Adres', path: 'Yol', name: 'Ad', openTab: 'Yeni sekmede aç', prev: 'Önceki', next: 'Sonraki', close: 'Kapat',
      untranslated: 'çevrilmedi', coverage: '{lang}: {pct} çevrildi', notOpenTag: 'henüz açık değil',
      translate: 'Çevir', addIcon: 'İkon ekle',
      footNote: 'Resmî olmayan hayran projesi; Warner Bros. Games, Avalanche Software veya Portkey Games ile bağlantısı yoktur.',
      footShort: 'Resmî olmayan hayran projesi', footRights: 'Görsel hakları', footContributing: 'Katkı rehberi', footRepo: 'GitHub',
      translating: '{lang} çevirisi', progress: '{total} adın {done} tanesi hazır ({pct})',
      draftsSaved: '{n} taslak bu tarayıcıda kayıtlı', draftSaved: '1 taslak bu tarayıcıda kayıtlı',
      draftsVolatile: '{n} taslak yalnızca bu sekmede. Tarayıcı bunları kaydetmiyor, kapatmadan önce gönder.',
      onlyUntranslated: 'Yalnızca çevrilmemişler', newLanguage: 'Yeni dil başlat…', newLanguageLabel: 'Yeni dil başlat', submit: 'Gönder', submitCount: '{n} ad gönder', done: 'Bitti',
      notOpenBar: '{lang} henüz açık değil. Burada taslak yazabilirsin, göndermek için önce dilin eklenmesi gerekir.',
      folderName: 'Klasör adı', draftTag: 'taslak', previewKey: 'Alt+Enter: büyük önizleme', nameFor: '{source} için ad, {path}',
      errLong: 'En fazla 120 karakter yaz.', errAngle: '< ve > işaretlerini çıkar.', errEntity: '&amp; gibi HTML kodu yerine karakterin kendisini yaz.', errUrl: 'Web adresini (://) çıkar.',
      errControl: 'Satır sonlarını ve kontrol karakterlerini çıkar.', errBidi: 'Yazı yönü değiştiren karakterleri çıkar.',
      sendTitle: 'Çeviriyi gönder', sendSummary: '{lang} için {n} ad.', sendSummaryOne: '{lang} için 1 ad.', sendNothing: 'Henüz gönderilecek bir şey yok. Önce bir ikona ad yaz.',
      sendStale: 'Dışarıda bırakılan: {n}. O ikonlar artık katalogda yok.',
      sendProblems: 'Göndermeden önce bunları düzelt:', sendShow: 'Göster', sendOffPage: 'Bu ikon ana katalog sayfasında.',
      sendOpen: 'Hazır doldurulmuş issue’yu GitHub’da aç',
      sendLong: 'Bu, bağlantıya sığmayacak kadar uzun. Kopyala, issue’yu aç, sonra "Translation data" alanına yapıştır.', sendCopyOpen: 'Kopyala ve GitHub’ı aç',
      sendParts: 'Bu tek issue için fazla uzun, bu yüzden {n} parçaya bölündü. Her parçayı ayrı issue olarak gönder. Her biri ayrı pull request olur.',
      sendPart: 'Parça {i} / {n}: {count} ad', sendPartLink: 'Hazır issue’yu aç', sendData: 'Çeviri verisi', sendCopy: 'Kopyala',
      sendNeeds: 'GitHub hesabın olmalı. GitHub’da koşullar kutusunu işaretleyip issue’yu gönder.',
      sendNext: 'Issue’ya otomatik bir kontrol yanıt verir. Adlar geçerse sahibin inceleyeceği bir pull request açar. Geçmezse sorunları listeler, issue’yu düzenleyince yeniden çalışır.',
      sendKeep: 'Adlar yayınlanana kadar taslaklarını sakla. Eşleştiklerinde kendiliğinden temizlenirler.',
      sendNotOpen: '{lang} henüz açık değil, bu yüzden GitHub bu adları reddeder. Dil eklemek, sahibin incelediği bir pull request ile olur. Şu satırı names/languages.json dosyasına ekle, sonra dönüp gönder: taslakların burada kalır.',
      sendLine: 'Eklenecek satır', sendEdit: 'names/languages.json dosyasını GitHub’da düzenle',
      discard: 'Bu taslakları sil', discardSure: 'Kalıcı olarak sil ({n})',
      helpTitle: 'Katkıda bulun',
      helpTranslateTitle: 'Adları çevir',
      helpTranslate: 'İkon adları açtığımız her dilde gösterilebilir. Çeviri moduna geç, adları doğrudan ikonların üstüne yaz, hazır olunca gönder. O zamana kadar taslakların bu tarayıcıda kalır. Göndermek için GitHub hesabın olmalı.',
      helpTranslateGo: 'Çeviriye başla',
      helpIconTitle: 'İkon ekle',
      helpIcon: 'İkonlar pull request ile eklenir, sahibi her birini inceler.',
      helpIconSteps: ['Depoyu fork’la ve bir dal aç.', 'icons/ altında uygun klasöre .webp dosyalarını ekle. Çoğu ikon icons/items/ içine girer.', 'Pull request aç ve şablonu doldur.'],
      helpIconTerms: 'Her dosyanın kaynağını belirt: kendin yaptın, oyundan ya da moddan; bir kısmını yapay zekâ aracı yaptıysa onu da yaz. Boyut sınırları ve adlandırma kuralları CONTRIBUTING.md dosyasında.',
      helpIconGo: 'CONTRIBUTING.md dosyasını oku', helpRepo: 'Depoyu aç',
      helpRightsTitle: 'Haklar',
      helpRights: 'Bu resmî olmayan bir hayran projesidir; Warner Bros. Games, Avalanche Software, Portkey Games veya Wizarding World ile bağlantısı yoktur, onlarca desteklenmez. Harry Potter ve ilgili ad ve markalar sahiplerine aittir. Kod MIT lisanslıdır, görseller değildir: her grubun ne olduğu ve nasıl kullanılabileceği ASSETS.md dosyasında.',
      helpRightsGo: 'ASSETS.md dosyasını oku'
    },
    de: {
      title: 'Icon-Katalog', search: 'Icons suchen…', searchLabel: 'Icons suchen', folders: 'Ordner', all: 'Alle', icon: '{n} Icon', icons: '{n} Icons',
      none: 'Keine Ergebnisse.', allDone: 'Hier hat jedes Icon einen Namen.', skip: 'Zu den Icons springen', contact: 'Kontakt:', language: 'Sprache', copy: 'Kopieren', copied: 'Kopiert', url: 'URL', path: 'Pfad', name: 'Name',
      openTab: 'In neuem Tab öffnen', prev: 'Zurück', next: 'Weiter', close: 'Schließen', untranslated: 'nicht übersetzt', coverage: '{lang}: {pct} übersetzt', notOpenTag: 'noch nicht offen',
      translate: 'Übersetzen', addIcon: 'Icon hinzufügen', footShort: 'Inoffizielles Fanprojekt', footRights: 'Bildrechte', footContributing: 'Mitwirken', translating: 'Übersetzung: {lang}', progress: '{done} von {total} benannt ({pct})',
      draftsSaved: '{n} Entwürfe in diesem Browser gespeichert', draftSaved: '1 Entwurf in diesem Browser gespeichert', onlyUntranslated: 'Nur unübersetzte',
      newLanguage: 'Neue Sprache beginnen…', newLanguageLabel: 'Neue Sprache beginnen', submit: 'Senden', submitCount: '{n} senden', done: 'Fertig', folderName: 'Ordnername', draftTag: 'Entwurf'
    },
    fr: {
      title: 'Catalogue d’icônes', search: 'Rechercher des icônes…', searchLabel: 'Rechercher des icônes', folders: 'Dossiers', all: 'Tout', icon: '{n} icône', icons: '{n} icônes',
      none: 'Aucun résultat.', allDone: 'Ici, chaque icône a un nom.', skip: 'Aller aux icônes', contact: 'Me contacter :', language: 'Langue', copy: 'Copier', copied: 'Copié', url: 'URL', path: 'Chemin', name: 'Nom',
      openTab: 'Ouvrir dans un nouvel onglet', prev: 'Précédent', next: 'Suivant', close: 'Fermer', untranslated: 'non traduit', coverage: '{lang} : {pct} traduit', notOpenTag: 'pas encore ouverte',
      translate: 'Traduire', addIcon: 'Ajouter une icône', footShort: 'Projet de fans non officiel', footRights: 'Droits des images', footContributing: 'Contribuer', translating: 'Traduction : {lang}', progress: '{done} noms sur {total} ({pct})',
      draftsSaved: '{n} brouillons enregistrés dans ce navigateur', draftSaved: '1 brouillon enregistré dans ce navigateur', onlyUntranslated: 'Non traduits uniquement',
      newLanguage: 'Commencer une nouvelle langue…', newLanguageLabel: 'Commencer une nouvelle langue', submit: 'Envoyer', submitCount: 'Envoyer {n}', done: 'Terminé', folderName: 'Nom du dossier', draftTag: 'brouillon'
    },
    es: {
      title: 'Catálogo de iconos', search: 'Buscar iconos…', searchLabel: 'Buscar iconos', folders: 'Carpetas', all: 'Todo', icon: '{n} icono', icons: '{n} iconos',
      none: 'Sin resultados.', allDone: 'Aquí todos los iconos tienen nombre.', skip: 'Ir a los iconos', contact: 'Contacto:', language: 'Idioma', copy: 'Copiar', copied: 'Copiado', url: 'URL', path: 'Ruta', name: 'Nombre',
      openTab: 'Abrir en una pestaña nueva', prev: 'Anterior', next: 'Siguiente', close: 'Cerrar', untranslated: 'sin traducir', coverage: '{lang}: {pct} traducido', notOpenTag: 'aún no abierto',
      translate: 'Traducir', addIcon: 'Añadir un icono', footShort: 'Proyecto de fans no oficial', footRights: 'Derechos de imagen', footContributing: 'Colaborar', translating: 'Traducción: {lang}', progress: '{done} de {total} con nombre ({pct})',
      draftsSaved: '{n} borradores guardados en este navegador', draftSaved: '1 borrador guardado en este navegador', onlyUntranslated: 'Solo sin traducir',
      newLanguage: 'Empezar un idioma nuevo…', newLanguageLabel: 'Empezar un idioma nuevo', submit: 'Enviar', submitCount: 'Enviar {n}', done: 'Listo', folderName: 'Nombre de la carpeta', draftTag: 'borrador'
    },
    'pt-BR': {
      title: 'Catálogo de ícones', search: 'Buscar ícones…', searchLabel: 'Buscar ícones', folders: 'Pastas', all: 'Todos', icon: '{n} ícone', icons: '{n} ícones',
      none: 'Nenhum resultado.', allDone: 'Aqui todos os ícones têm nome.', skip: 'Ir para os ícones', contact: 'Contato:', language: 'Idioma', copy: 'Copiar', copied: 'Copiado', url: 'URL', path: 'Caminho', name: 'Nome',
      openTab: 'Abrir em nova aba', prev: 'Anterior', next: 'Próximo', close: 'Fechar', untranslated: 'sem tradução', coverage: '{lang}: {pct} traduzido', notOpenTag: 'ainda não aberto',
      translate: 'Traduzir', addIcon: 'Adicionar um ícone', footShort: 'Projeto de fãs não oficial', footRights: 'Direitos das imagens', footContributing: 'Contribuir', translating: 'Tradução: {lang}', progress: '{done} de {total} com nome ({pct})',
      draftsSaved: '{n} rascunhos salvos neste navegador', draftSaved: '1 rascunho salvo neste navegador', onlyUntranslated: 'Só sem tradução',
      newLanguage: 'Começar um novo idioma…', newLanguageLabel: 'Começar um novo idioma', submit: 'Enviar', submitCount: 'Enviar {n}', done: 'Concluir', folderName: 'Nome da pasta', draftTag: 'rascunho'
    },
    it: {
      title: 'Catalogo di icone', search: 'Cerca icone…', searchLabel: 'Cerca icone', folders: 'Cartelle', all: 'Tutte', icon: '{n} icona', icons: '{n} icone',
      none: 'Nessun risultato.', allDone: 'Qui ogni icona ha un nome.', skip: 'Vai alle icone', contact: 'Contatto:', language: 'Lingua', copy: 'Copia', copied: 'Copiato', url: 'URL', path: 'Percorso', name: 'Nome',
      openTab: 'Apri in una nuova scheda', prev: 'Precedente', next: 'Successiva', close: 'Chiudi', untranslated: 'non tradotto', coverage: '{lang}: {pct} tradotto', notOpenTag: 'non ancora aperta',
      translate: 'Traduci', addIcon: 'Aggiungi un’icona', footShort: 'Progetto di fan non ufficiale', footRights: 'Diritti delle immagini', footContributing: 'Contribuisci', translating: 'Traduzione: {lang}', progress: '{done} di {total} con nome ({pct})',
      draftsSaved: '{n} bozze salvate in questo browser', draftSaved: '1 bozza salvata in questo browser', onlyUntranslated: 'Solo non tradotte',
      newLanguage: 'Inizia una nuova lingua…', newLanguageLabel: 'Inizia una nuova lingua', submit: 'Invia', submitCount: 'Invia {n}', done: 'Fine', folderName: 'Nome della cartella', draftTag: 'bozza'
    },
    pl: {
      title: 'Katalog ikon', search: 'Szukaj ikon…', searchLabel: 'Szukaj ikon', folders: 'Foldery', all: 'Wszystkie', icon: 'Ikony: {n}', icons: 'Ikony: {n}',
      none: 'Brak wyników.', allDone: 'Tutaj każda ikona ma nazwę.', skip: 'Przejdź do ikon', contact: 'Kontakt:', language: 'Język', copy: 'Kopiuj', copied: 'Skopiowano', url: 'URL', path: 'Ścieżka', name: 'Nazwa',
      openTab: 'Otwórz w nowej karcie', prev: 'Poprzednia', next: 'Następna', close: 'Zamknij', untranslated: 'bez tłumaczenia', coverage: '{lang}: przetłumaczono {pct}', notOpenTag: 'jeszcze nieotwarty',
      translate: 'Tłumacz', addIcon: 'Dodaj ikonę', footShort: 'Nieoficjalny projekt fanowski', footRights: 'Prawa do obrazów', footContributing: 'Współtworzenie', translating: 'Tłumaczenie: {lang}', progress: 'Nazwy: {done} z {total} ({pct})',
      draftsSaved: 'Szkice zapisane w tej przeglądarce: {n}', draftSaved: 'Szkice zapisane w tej przeglądarce: 1', onlyUntranslated: 'Tylko bez tłumaczenia',
      newLanguage: 'Zacznij nowy język…', newLanguageLabel: 'Zacznij nowy język', submit: 'Wyślij', submitCount: 'Wyślij ({n})', done: 'Gotowe', folderName: 'Nazwa folderu', draftTag: 'szkic'
    },
    nl: {
      title: 'Pictogramcatalogus', search: 'Pictogrammen zoeken…', searchLabel: 'Pictogrammen zoeken', folders: 'Mappen', all: 'Alles', icon: '{n} pictogram', icons: '{n} pictogrammen',
      none: 'Geen resultaten.', allDone: 'Hier heeft elk pictogram een naam.', skip: 'Naar de pictogrammen', contact: 'Contact:', language: 'Taal', copy: 'Kopiëren', copied: 'Gekopieerd', url: 'URL', path: 'Pad', name: 'Naam',
      openTab: 'In nieuw tabblad openen', prev: 'Vorige', next: 'Volgende', close: 'Sluiten', untranslated: 'niet vertaald', coverage: '{lang}: {pct} vertaald', notOpenTag: 'nog niet open',
      translate: 'Vertalen', addIcon: 'Pictogram toevoegen', footShort: 'Onofficieel fanproject', footRights: 'Beeldrechten', footContributing: 'Bijdragen', translating: 'Vertaling: {lang}', progress: '{done} van {total} benoemd ({pct})',
      draftsSaved: '{n} concepten opgeslagen in deze browser', draftSaved: '1 concept opgeslagen in deze browser', onlyUntranslated: 'Alleen niet vertaald',
      newLanguage: 'Nieuwe taal beginnen…', newLanguageLabel: 'Nieuwe taal beginnen', submit: 'Versturen', submitCount: '{n} versturen', done: 'Klaar', folderName: 'Mapnaam', draftTag: 'concept'
    },
    cs: {
      title: 'Katalog ikon', search: 'Hledat ikony…', searchLabel: 'Hledat ikony', folders: 'Složky', all: 'Vše', icon: 'Ikony: {n}', icons: 'Ikony: {n}',
      none: 'Žádné výsledky.', allDone: 'Tady má každá ikona název.', skip: 'Přejít na ikony', contact: 'Kontakt:', language: 'Jazyk', copy: 'Kopírovat', copied: 'Zkopírováno', url: 'URL', path: 'Cesta', name: 'Název',
      openTab: 'Otevřít na nové kartě', prev: 'Předchozí', next: 'Další', close: 'Zavřít', untranslated: 'nepřeloženo', coverage: '{lang}: přeloženo {pct}', notOpenTag: 'zatím neotevřeno',
      translate: 'Překládat', addIcon: 'Přidat ikonu', footShort: 'Neoficiální fanouškovský projekt', footRights: 'Práva k obrázkům', footContributing: 'Přispívání', translating: 'Překlad: {lang}', progress: 'Názvy: {done} z {total} ({pct})',
      draftsSaved: 'Koncepty uložené v tomto prohlížeči: {n}', draftSaved: 'Koncepty uložené v tomto prohlížeči: 1', onlyUntranslated: 'Jen nepřeložené',
      newLanguage: 'Začít nový jazyk…', newLanguageLabel: 'Začít nový jazyk', submit: 'Odeslat', submitCount: 'Odeslat ({n})', done: 'Hotovo', folderName: 'Název složky', draftTag: 'koncept'
    },
    uk: {
      title: 'Каталог значків', search: 'Шукати значки…', searchLabel: 'Шукати значки', folders: 'Теки', all: 'Усі', icon: 'Значки: {n}', icons: 'Значки: {n}',
      none: 'Нічого не знайдено.', allDone: 'Тут кожен значок має назву.', skip: 'Перейти до значків', contact: 'Контакт:', language: 'Мова', copy: 'Копіювати', copied: 'Скопійовано', url: 'URL', path: 'Шлях', name: 'Назва',
      openTab: 'Відкрити в новій вкладці', prev: 'Попередній', next: 'Наступний', close: 'Закрити', untranslated: 'не перекладено', coverage: '{lang}: перекладено {pct}', notOpenTag: 'ще не відкрито',
      translate: 'Перекласти', addIcon: 'Додати значок', footShort: 'Неофіційний фанатський проєкт', footRights: 'Права на зображення', footContributing: 'Як долучитися', translating: 'Переклад: {lang}', progress: 'Назви: {done} з {total} ({pct})',
      draftsSaved: 'Чернетки в цьому браузері: {n}', draftSaved: 'Чернетки в цьому браузері: 1', onlyUntranslated: 'Лише неперекладені',
      newLanguage: 'Почати нову мову…', newLanguageLabel: 'Почати нову мову', submit: 'Надіслати', submitCount: 'Надіслати ({n})', done: 'Готово', folderName: 'Назва теки', draftTag: 'чернетка'
    },
    ru: {
      title: 'Каталог значков', search: 'Искать значки…', searchLabel: 'Искать значки', folders: 'Папки', all: 'Все', icon: 'Значки: {n}', icons: 'Значки: {n}',
      none: 'Ничего не найдено.', allDone: 'Здесь у каждого значка есть название.', skip: 'Перейти к значкам', contact: 'Контакт:', language: 'Язык', copy: 'Копировать', copied: 'Скопировано', url: 'URL', path: 'Путь', name: 'Название',
      openTab: 'Открыть в новой вкладке', prev: 'Предыдущий', next: 'Следующий', close: 'Закрыть', untranslated: 'не переведено', coverage: '{lang}: переведено {pct}', notOpenTag: 'ещё не открыт',
      translate: 'Перевести', addIcon: 'Добавить значок', footShort: 'Неофициальный фанатский проект', footRights: 'Права на изображения', footContributing: 'Как помочь', translating: 'Перевод: {lang}', progress: 'Названия: {done} из {total} ({pct})',
      draftsSaved: 'Черновики в этом браузере: {n}', draftSaved: 'Черновики в этом браузере: 1', onlyUntranslated: 'Только без перевода',
      newLanguage: 'Начать новый язык…', newLanguageLabel: 'Начать новый язык', submit: 'Отправить', submitCount: 'Отправить ({n})', done: 'Готово', folderName: 'Название папки', draftTag: 'черновик'
    },
    ja: {
      title: 'アイコンカタログ', search: 'アイコンを検索…', searchLabel: 'アイコンを検索', folders: 'フォルダー', all: 'すべて', icon: '{n} 個のアイコン', icons: '{n} 個のアイコン',
      none: '結果はありません。', allDone: 'ここのアイコンにはすべて名前があります。', skip: 'アイコンへ移動', contact: '連絡先:', language: '言語', copy: 'コピー', copied: 'コピーしました', url: 'URL', path: 'パス', name: '名前',
      openTab: '新しいタブで開く', prev: '前へ', next: '次へ', close: '閉じる', untranslated: '未翻訳', coverage: '{lang}: {pct} 翻訳済み', notOpenTag: '未公開',
      translate: '翻訳する', addIcon: 'アイコンを追加', footShort: '非公式ファンプロジェクト', footRights: '画像の権利', footContributing: '貢献する', translating: '{lang} に翻訳中', progress: '{total} 件中 {done} 件 ({pct})',
      draftsSaved: '{n} 件の下書きをこのブラウザーに保存しました', draftSaved: '1 件の下書きをこのブラウザーに保存しました', onlyUntranslated: '未翻訳のみ',
      newLanguage: '新しい言語を始める…', newLanguageLabel: '新しい言語を始める', submit: '送信', submitCount: '{n} 件を送信', done: '完了', folderName: 'フォルダー名', draftTag: '下書き'
    },
    ko: {
      title: '아이콘 카탈로그', search: '아이콘 검색…', searchLabel: '아이콘 검색', folders: '폴더', all: '전체', icon: '아이콘 {n}개', icons: '아이콘 {n}개',
      none: '결과가 없습니다.', allDone: '여기 있는 아이콘은 모두 이름이 있습니다.', skip: '아이콘으로 건너뛰기', contact: '연락처:', language: '언어', copy: '복사', copied: '복사됨', url: 'URL', path: '경로', name: '이름',
      openTab: '새 탭에서 열기', prev: '이전', next: '다음', close: '닫기', untranslated: '번역 안 됨', coverage: '{lang}: {pct} 번역됨', notOpenTag: '아직 열리지 않음',
      translate: '번역하기', addIcon: '아이콘 추가', footShort: '비공식 팬 프로젝트', footRights: '이미지 권리', footContributing: '기여하기', translating: '{lang} 번역 중', progress: '{total}개 중 {done}개 ({pct})',
      draftsSaved: '이 브라우저에 초안 {n}개 저장됨', draftSaved: '이 브라우저에 초안 1개 저장됨', onlyUntranslated: '번역 안 된 것만',
      newLanguage: '새 언어 시작…', newLanguageLabel: '새 언어 시작', submit: '보내기', submitCount: '{n}개 보내기', done: '완료', folderName: '폴더 이름', draftTag: '초안'
    },
    'zh-CN': {
      title: '图标目录', search: '搜索图标…', searchLabel: '搜索图标', folders: '文件夹', all: '全部', icon: '{n} 个图标', icons: '{n} 个图标',
      none: '没有结果。', allDone: '这里的每个图标都有名称。', skip: '跳到图标', contact: '联系我:', language: '语言', copy: '复制', copied: '已复制', url: '网址', path: '路径', name: '名称',
      openTab: '在新标签页中打开', prev: '上一个', next: '下一个', close: '关闭', untranslated: '未翻译', coverage: '{lang}:已翻译 {pct}', notOpenTag: '尚未开放',
      translate: '翻译', addIcon: '添加图标', footShort: '非官方粉丝项目', footRights: '图片权利', footContributing: '参与贡献', translating: '正在翻译为{lang}', progress: '{total} 个中已命名 {done} 个 ({pct})',
      draftsSaved: '{n} 份草稿已保存在此浏览器', draftSaved: '1 份草稿已保存在此浏览器', onlyUntranslated: '仅未翻译',
      newLanguage: '开始新语言…', newLanguageLabel: '开始新语言', submit: '提交', submitCount: '提交 {n} 项', done: '完成', folderName: '文件夹名称', draftTag: '草稿'
    },
    'zh-TW': {
      title: '圖示目錄', search: '搜尋圖示…', searchLabel: '搜尋圖示', folders: '資料夾', all: '全部', icon: '{n} 個圖示', icons: '{n} 個圖示',
      none: '沒有結果。', allDone: '這裡的每個圖示都有名稱。', skip: '跳到圖示', contact: '聯絡我:', language: '語言', copy: '複製', copied: '已複製', url: '網址', path: '路徑', name: '名稱',
      openTab: '在新分頁中開啟', prev: '上一個', next: '下一個', close: '關閉', untranslated: '未翻譯', coverage: '{lang}:已翻譯 {pct}', notOpenTag: '尚未開放',
      translate: '翻譯', addIcon: '新增圖示', footShort: '非官方粉絲專案', footRights: '圖片權利', footContributing: '參與貢獻', translating: '正在翻譯為{lang}', progress: '{total} 個中已命名 {done} 個 ({pct})',
      draftsSaved: '{n} 份草稿已儲存在此瀏覽器', draftSaved: '1 份草稿已儲存在此瀏覽器', onlyUntranslated: '僅未翻譯',
      newLanguage: '開始新語言…', newLanguageLabel: '開始新語言', submit: '提交', submitCount: '提交 {n} 項', done: '完成', folderName: '資料夾名稱', draftTag: '草稿'
    }
  };

  var lang = 'en';
  var languages = DEFAULT_LANGUAGES;
  var names = {};
  var drafts = {};
  var storageOk = true;
  var translating = false;
  var items = [];
  var nodes = [];
  var known = {};
  var byKey = {};
  var byNode = {};
  var root = { name: '', label: '', path: '', key: '', count: 0, open: 0, rest: 0, translatable: true, kids: {} };
  var closed = {};
  var state = { node: '', q: '', untranslated: false };
  var list = [];
  var shown = 0;
  var current = -1;
  var loaded = false;
  var saveTimer;
  var $ = function (id) { return document.getElementById(id); };
  var own = function (obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); };

  /* ---------- small helpers ---------- */

  function el(tag, props, kids) {
    var node = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (type) { node.addEventListener(type, v[type]); });
      else if (k in node) node[k] = v;
      else node.setAttribute(k, v);
    });
    (kids || []).forEach(function (kid) { if (kid) node.append(kid); });
    return node;
  }

  function ui() {
    return UI[lang] || UI.en;
  }

  function t(key, vars) {
    var table = ui();
    var text = own(table, key) ? table[key] : UI.en[key];
    return text.replace(/\{(\w+)\}/g, function (m, v) { return vars && own(vars, v) ? vars[v] : m; });
  }

  function fmt(n) {
    try { return n.toLocaleString(lang); } catch (e) { return String(n); }
  }

  function pct(done, total) {
    var value = total ? Math.floor((done / total) * 100) / 100 : 0;
    try { return value.toLocaleString(lang, { style: 'percent' }); } catch (e) { return Math.round(value * 100) + '%'; }
  }

  function iconCount(n) {
    return t(n === 1 ? 'icon' : 'icons', { n: fmt(n) });
  }

  function languageName(code) {
    return own(languages, code) ? languages[code] : own(PROPOSABLE, code) ? PROPOSABLE[code] : code;
  }

  function isOpen(code) {
    return own(languages, code);
  }

  /* ---------- storage: everything must keep working without it ---------- */

  function storeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { storageOk = false; return null; }
  }

  function storeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function storeRemove(key) {
    try { localStorage.removeItem(key); return true; } catch (e) { return false; }
  }

  function loadDrafts() {
    var raw = storeGet(STORE_DRAFTS);
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    if (!data || typeof data !== 'object') return;
    Object.keys(data).forEach(function (code) {
      if (!own(PROPOSABLE, code) && !isOpen(code)) return;
      var entries = data[code];
      if (!entries || typeof entries !== 'object') return;
      Object.keys(entries).forEach(function (key) {
        if (typeof entries[key] !== 'string') return;
        (own(drafts, code) ? drafts[code] : (drafts[code] = {}))[key] = entries[key];
      });
    });
  }

  function saveDrafts() {
    clearTimeout(saveTimer);
    saveTimer = null;
    storageOk = Object.keys(drafts).length ? storeSet(STORE_DRAFTS, JSON.stringify(drafts)) : storeRemove(STORE_DRAFTS);
    renderStatus();
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDrafts, 300);
  }

  function draftsOf(code) {
    return own(drafts, code) ? drafts[code] : {};
  }

  function draftCount(code) {
    return Object.keys(draftsOf(code)).length;
  }

  function hasDraft(key) {
    return own(draftsOf(lang), key);
  }

  // A draft only exists while it differs from the published name, so a merged translation clears itself.
  function pruneDrafts(code) {
    if (!own(drafts, code)) return;
    var published = own(names, code) ? names[code] : {};
    var changed = false;
    Object.keys(drafts[code]).forEach(function (key) {
      if (own(published, key) && published[key] === drafts[code][key]) {
        delete drafts[code][key];
        changed = true;
      }
    });
    if (!Object.keys(drafts[code]).length) delete drafts[code];
    if (changed) saveDrafts();
  }

  function setDraft(key, raw) {
    var value = raw.trim();
    var entries = own(drafts, lang) ? drafts[lang] : (drafts[lang] = {});
    if (!value || value === published(key)) delete entries[key];
    else entries[key] = value;
    if (!Object.keys(entries).length) delete drafts[lang];
    scheduleSave();
    renderStatus();
  }

  /* ---------- names ---------- */

  function published(key) {
    var table = own(names, lang) ? names[lang] : null;
    return table && own(table, key) ? table[key] : '';
  }

  function englishName(key) {
    var table = own(names, 'en') ? names.en : null;
    return table && own(table, key) ? table[key] : '';
  }

  function isUntranslated(key) {
    return own(known, key) && !published(key) && !(translating && hasDraft(key));
  }

  // Fallback order set by the contract: this language's name, then a name from the file. Never another language.
  function fileName(file) {
    return lang === 'tr' ? baseName(file) : pretty(file);
  }

  function folderName(name) {
    return lang === 'tr' ? name : name.charAt(0).toUpperCase() + name.slice(1);
  }

  function shownName(key, fallback) {
    if (translating && hasDraft(key)) return draftsOf(lang)[key];
    return published(key) || fallback;
  }

  function relabel() {
    nodes.forEach(function (node) { node.label = shownName(node.key, folderName(node.name)); });
    items.forEach(function (it) {
      it.label = shownName(it.key, fileName(it.file));
      it.lower = (it.rel + ' ' + it.label + ' ' + englishName(it.key) + ' ' + dirLabel(it.dir, 0)).toLowerCase();
    });
  }

  function nameProblem(value) {
    if (Array.from(value).length > NAME_LIMIT) return 'errLong';
    if (/[<>]/.test(value)) return 'errAngle';
    if (/&(#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i.test(value)) return 'errEntity';
    if (value.indexOf('://') >= 0) return 'errUrl';
    if (/[\u202a-\u202e\u2066-\u2069]/.test(value)) return 'errBidi';
    if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029\ufeff\ud800-\udfff]/u.test(value)) return 'errControl';
    return '';
  }

  function coverage(code) {
    var table = own(names, code) ? names[code] : {};
    var done = 0;
    var total = 0;
    items.concat(nodes).forEach(function (entry) {
      if (!entry.translatable) return;
      total++;
      if (own(table, entry.key)) done++;
    });
    return { done: done, total: total };
  }

  /* ---------- hash ---------- */

  function readHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var i = h.indexOf('?');
    var path = i < 0 ? h : h.slice(0, i);
    try { path = decodeURIComponent(path); } catch (e) { path = ''; }
    var params = new URLSearchParams(i < 0 ? '' : h.slice(i + 1));
    state.node = path.replace(/\/+$/, '');
    state.q = params.get('q') || '';
    return params;
  }

  function writeHash() {
    var parts = [];
    if (state.q) parts.push('q=' + encodeURIComponent(state.q));
    if (translating) parts.push('translate=1');
    history.replaceState(null, '', '#/' + state.node.split('/').map(encodeURIComponent).join('/') + (parts.length ? '?' + parts.join('&') : ''));
  }

  /* ---------- catalog tree ---------- */

  function build(dirs) {
    var prefix = ROOT + '/';
    Object.keys(dirs).sort().forEach(function (dir) {
      if (dir.indexOf(prefix) !== 0) return;
      dirs[dir].forEach(function (file) {
        if (!TRANSLATABLE_EXT.test(file)) return;
        known[dir + '/' + baseName(file)] = true;
        var keyPath = '';
        dir.split('/').forEach(function (p) {
          keyPath = keyPath ? keyPath + '/' + p : p;
          known[keyPath] = true;
        });
      });
      var rel = dir.slice(prefix.length);
      var node = root;
      var chain = [root];
      var path = '';
      rel.split('/').forEach(function (p) {
        path = path ? path + '/' + p : p;
        if (!own(node.kids, p)) {
          node.kids[p] = { name: p, label: p, path: path, key: prefix + path, count: 0, open: 0, rest: 0, translatable: false, kids: {} };
          nodes.push(node.kids[p]);
          byNode[prefix + path] = node.kids[p];
        }
        node = node.kids[p];
        chain.push(node);
      });
      dirs[dir].forEach(function (file) {
        var full = dir + '/' + file;
        var key = dir + '/' + baseName(file);
        var it = { dir: rel, file: file, path: full, key: key, rel: rel + '/' + file, label: '', lower: '', chain: chain, translatable: own(known, key) };
        items.push(it);
        byKey[key] = it;
        chain.forEach(function (n) {
          n.count++;
          if (it.translatable) {
            n.open++;
            n.translatable = true;
          }
        });
      });
    });
  }

  function dirLabel(dir, skip) {
    var node = root;
    var out = [];
    dir.split('/').forEach(function (p) {
      node = node && own(node.kids, p) ? node.kids[p] : null;
      if (node) out.push(node.label);
    });
    return out.slice(skip).join(' / ');
  }

  function find(path) {
    if (!path) return root;
    var node = root;
    var parts = path.split('/');
    for (var i = 0; i < parts.length; i++) {
      if (!own(node.kids, parts[i])) return null;
      node = node.kids[parts[i]];
    }
    return node;
  }

  function sortedKids(node) {
    return Object.keys(node.kids).filter(function (k) {
      return !translating || node.kids[k].translatable;
    }).sort(function (a, b) {
      return node.kids[a].label.localeCompare(node.kids[b].label, lang);
    }).map(function (k) { return node.kids[k]; });
  }

  function countRemaining() {
    root.rest = 0;
    nodes.forEach(function (node) { node.rest = 0; });
    items.forEach(function (it) {
      if (isUntranslated(it.key)) it.chain.forEach(function (n) { n.rest++; });
    });
  }

  function onlyUntranslated() {
    return translating && state.untranslated;
  }

  function renderTree() {
    var ul = $('tree');
    ul.textContent = '';
    if (onlyUntranslated()) countRemaining();
    var top = document.createElement('li');
    top.appendChild(nodeButton(root, t('all'), false));
    ul.appendChild(top);
    sortedKids(root).forEach(function (n) { ul.appendChild(branch(n)); });
  }

  function nodeButton(node, label, hasKids) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'node';
    if (node.path === state.node) b.setAttribute('aria-current', 'true');
    var car = document.createElement('span');
    car.className = 'car';
    car.textContent = hasKids ? (closed[node.path] ? '▸' : '▾') : '';
    var nm = document.createElement('span');
    nm.className = 'nm';
    nm.dir = 'auto';
    nm.textContent = label;
    if (translating && node.key && isUntranslated(node.key)) nm.appendChild(untranslatedMark());
    var ct = document.createElement('span');
    ct.className = 'ct';
    ct.textContent = fmt(onlyUntranslated() ? node.rest : translating ? node.open : node.count);
    b.append(car, nm, ct);
    b.addEventListener('click', function () {
      if (hasKids) closed[node.path] = node.path === state.node ? !closed[node.path] : false;
      select(node.path);
      setNav(false);
    });
    return b;
  }

  function branch(node) {
    var kids = sortedKids(node);
    var li = document.createElement('li');
    li.appendChild(nodeButton(node, node.label, kids.length > 0));
    if (kids.length && !closed[node.path]) {
      var ul = document.createElement('ul');
      kids.forEach(function (k) { ul.appendChild(branch(k)); });
      li.appendChild(ul);
    }
    return li;
  }

  function renderCrumbs() {
    var crumbs = $('crumbs');
    crumbs.textContent = '';
    var all = document.createElement('button');
    all.type = 'button';
    all.textContent = t('all');
    all.onclick = function () { select(''); };
    crumbs.appendChild(all);
    if (!state.node) return;
    var path = '';
    state.node.split('/').forEach(function (p) {
      path = path ? path + '/' + p : p;
      var sep = document.createElement('span');
      sep.textContent = '/';
      var target = path;
      var b = document.createElement('button');
      b.type = 'button';
      b.dir = 'auto';
      b.textContent = find(target).label;
      b.onclick = function () { select(target); };
      crumbs.append(sep, b);
    });
  }

  function baseName(file) {
    return file.replace(/\.[a-z0-9]+$/i, '');
  }

  function pretty(file) {
    return baseName(file)
      .replace(/^MOD_/, '')
      .replace(/_UI(_T)?_/, ' – ')
      .replace(/^UI(_T)?_/, '')
      .replace(/^wy_/, '')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function urlOf(it) {
    return BASE + it.path.split('/').map(encodeURIComponent).join('/');
  }

  function untranslatedMark() {
    return el('span', { class: 'unt', title: t('untranslated') }, [
      el('span', { text: '○', 'aria-hidden': 'true' }),
      el('span', { class: 'sr', text: ' (' + t('untranslated') + ')' })
    ]);
  }

  /* ---------- grid ---------- */

  function filter() {
    var prefix = state.node ? state.node + '/' : '';
    var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    var only = onlyUntranslated();
    list = items.filter(function (it) {
      if (prefix && it.rel.indexOf(prefix) !== 0) return false;
      if (translating && !it.translatable) return false;
      if (only && !isUntranslated(it.key)) return false;
      for (var i = 0; i < words.length; i++) if (it.lower.indexOf(words[i]) < 0) return false;
      return true;
    });
    shown = 0;
    $('grid').textContent = '';
    var noneKey = only && !words.length ? 'allDone' : 'none';
    $('empty').dataset.t = noneKey;
    $('empty').textContent = t(noneKey);
    $('empty').hidden = list.length > 0;
    $('count').textContent = iconCount(list.length);
    renderLegend();
    more();
  }

  function renderLegend() {
    var legend = $('legend');
    legend.textContent = '';
    if (translating || !loaded) return;
    var cover = coverage(lang);
    legend.append(el('span', { text: t('coverage', { lang: languageName(lang), pct: pct(cover.done, cover.total) }) }));
    if (cover.done < cover.total) legend.append(' · ', el('span', { 'aria-hidden': 'true', text: '○ ' }), t('untranslated'));
  }

  function more() {
    var end = Math.min(list.length, shown + CHUNK);
    var frag = document.createDocumentFragment();
    for (var i = shown; i < end; i++) frag.appendChild(translating ? editFigure(list[i], i) : viewFigure(list[i], i));
    $('grid').appendChild(frag);
    shown = end;
  }

  function thumb(it) {
    var img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = it.file;
    img.src = urlOf(it);
    return img;
  }

  function viewFigure(it, i) {
    var fig = document.createElement('figure');
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.title = it.rel;
    fig.dataset.i = i;
    var cap = document.createElement('figcaption');
    var name = document.createElement('b');
    name.dir = 'auto';
    name.textContent = it.label;
    if (isUntranslated(it.key)) name.prepend(untranslatedMark());
    var dir = document.createElement('small');
    dir.textContent = dirLabel(it.dir, state.node ? state.node.split('/').length : 0) || ' ';
    cap.append(name, dir);
    fig.append(thumb(it), cap);
    return fig;
  }

  function sourceName(it) {
    return (lang !== 'en' && englishName(it.key)) || pretty(it.file);
  }

  function editFigure(it, i) {
    var fig = document.createElement('figure');
    fig.className = 'edit';
    fig.dataset.i = i;
    var source = sourceName(it);
    var input = el('input', {
      type: 'text', class: 'nm-in', dir: 'auto', spellcheck: false, autocomplete: 'off',
      value: hasDraft(it.key) ? draftsOf(lang)[it.key] : published(it.key),
      placeholder: fileName(it.file),
      'aria-label': t('nameFor', { source: source, path: it.rel }),
      'aria-keyshortcuts': 'Alt+Enter', title: t('previewKey')
    });
    input.dataset.key = it.key;
    var src = el('small', { class: 'src', title: it.rel }, [
      el('span', { dir: 'auto', text: source }),
      el('span', { class: 'dr', text: t('draftTag') })
    ]);
    var err = el('small', { class: 'err', id: 'err-' + i, hidden: true });
    input.setAttribute('aria-describedby', err.id);
    var cap = el('figcaption', null, [input, src, err]);
    fig.append(thumb(it), cap);
    markInput(input);
    return fig;
  }

  function markInput(input) {
    var key = input.dataset.key;
    var fig = input.closest('figure');
    var err = input.parentNode.querySelector('.err');
    var value = input.value.trim();
    var problem = value ? nameProblem(value) : '';
    input.classList.toggle('has-draft', hasDraft(key));
    if (fig) fig.classList.toggle('drafted', hasDraft(key));
    input.setAttribute('aria-invalid', problem ? 'true' : 'false');
    if (err) {
      err.hidden = !problem;
      err.textContent = problem ? t(problem) : '';
    }
  }

  function commitInput(input) {
    var key = input.dataset.key;
    setDraft(key, input.value);
    markInput(input);
    var it = own(byKey, key) ? byKey[key] : null;
    if (it) {
      it.label = shownName(key, fileName(it.file));
      it.lower = (it.rel + ' ' + it.label + ' ' + englishName(key) + ' ' + dirLabel(it.dir, 0)).toLowerCase();
    }
  }

  function moveFocus(from, delta) {
    var fig = from.closest('figure');
    var next = Number(fig.dataset.i) + delta;
    if (next < 0 || next >= list.length) return;
    while (next >= shown) more();
    var target = $('grid').querySelector('figure[data-i="' + next + '"] input');
    if (target) { target.focus(); target.select(); }
  }

  /* ---------- folder name, translate mode only ---------- */

  function renderFolderEdit() {
    var old = $('folder-edit');
    if (old) old.remove();
    if (!translating || !state.node) return;
    var node = find(state.node);
    if (!own(known, node.key)) return;
    var err = el('small', { class: 'err', id: 'folder-err', hidden: true });
    var input = el('input', {
      type: 'text', id: 'folder-in', class: 'nm-in', dir: 'auto', spellcheck: false, autocomplete: 'off',
      value: hasDraft(node.key) ? draftsOf(lang)[node.key] : published(node.key),
      placeholder: folderName(node.name),
      on: {
        input: function () { commitInput(input); },
        change: function () {
          relabel();
          renderTree();
          renderCrumbs();
          input.focus();
        }
      }
    });
    input.dataset.key = node.key;
    input.setAttribute('aria-describedby', 'folder-err');
    var label = el('label', { htmlFor: 'folder-in', text: t('folderName') });
    var box = el('div', { id: 'folder-edit', class: 'folder-edit' }, [label, el('div', { class: 'folder-in' }, [input, err])]);
    $('bar').appendChild(box);
    markInput(input);
  }

  /* ---------- select ---------- */

  function select(path) {
    var node = find(path);
    state.node = node && (!translating || node.translatable) ? path : '';
    writeHash();
    renderTree();
    renderCrumbs();
    renderFolderEdit();
    filter();
    $('main').scrollTop = 0;
  }

  /* ---------- copy ---------- */

  function copy(text, btn) {
    var done = function () {
      if (!btn || btn.classList.contains('ok')) return;
      var label = btn.textContent;
      btn.textContent = t('copied');
      btn.classList.add('ok');
      setTimeout(function () { btn.textContent = label; btn.classList.remove('ok'); }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text, btn); done(); });
    } else {
      fallback(text, btn);
      done();
    }
  }

  // A modal dialog makes the rest of the page inert, so the helper has to live inside it.
  function fallback(text, btn) {
    var host = (btn && btn.closest('dialog')) || document.body;
    var ta = document.createElement('textarea');
    ta.value = text;
    host.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  /* ---------- icon dialog ---------- */

  function show(i) {
    if (i < 0 || i >= list.length) return;
    current = i;
    var it = list[i];
    var url = urlOf(it);
    $('d-title').dir = 'auto';
    $('d-title').textContent = it.label;
    $('d-img').src = url;
    $('d-img').alt = it.file;
    $('d-dim').textContent = '';
    $('d-url').value = url;
    $('d-path').value = it.path;
    $('d-name').value = baseName(it.file);
    $('d-open').href = url;
    $('d-pos').textContent = fmt(i + 1) + ' / ' + fmt(list.length) + (isUntranslated(it.key) ? ' · ' + t('untranslated') : '');
    var dlg = $('dlg');
    if (!dlg.open) dlg.showModal();
  }

  function step(delta) {
    var next = current + delta;
    if (next < 0 || next >= list.length) return;
    while (next >= shown) more();
    show(next);
  }

  /* ---------- static text ---------- */

  function applyStatic() {
    var html = document.documentElement;
    html.lang = own(UI, lang) ? lang : 'en';
    $('grid').lang = lang;
    $('tree').lang = lang;
    var title = t('title');
    document.title = title;
    $('title').textContent = title;
    $('q').placeholder = t('search');
    $('q').setAttribute('aria-label', t('searchLabel'));
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (node) {
      if (!node.classList.contains('ok')) node.textContent = t(node.dataset.t);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-t-label]'), function (node) {
      var label = t(node.dataset.tLabel);
      node.setAttribute('aria-label', label);
      node.title = node.id === 'd-prev' ? label + ' (←)' : node.id === 'd-next' ? label + ' (→)' : label + ' (Esc)';
    });
  }

  function renderFooter() {
    var foot = $('foot');
    foot.textContent = '';
    foot.append(
      el('span', { class: own(ui(), 'footNote') ? 'note-long' : '', text: own(ui(), 'footNote') ? t('footNote') : t('footShort') }),
      own(ui(), 'footNote') ? el('span', { class: 'note-short', text: t('footShort') }) : '',
      el('span', { class: 'links' }, [
        el('a', { href: REPO + '/blob/main/ASSETS.md', target: '_blank', rel: 'noopener', text: t('footRights') }),
        el('a', { href: REPO + '/blob/main/CONTRIBUTING.md', target: '_blank', rel: 'noopener', text: t('footContributing') }),
        el('a', { href: REPO, target: '_blank', rel: 'noopener', text: t('footRepo') })
      ])
    );
  }

  /* ---------- language selector ---------- */

  function renderTools() {
    var box = $('tools');
    box.textContent = '';
    var picker = el('select', {
      id: 'lang', 'aria-label': t('language'), title: t('language'),
      on: { change: function (e) { setLang(e.target.value); }, focus: loadAllNames, pointerdown: loadAllNames }
    });
    languageOptions().forEach(function (code) {
      picker.appendChild(el('option', { value: code, text: languageLabel(code), selected: code === lang }));
    });
    var count = draftCount(lang);
    box.append(picker);
    if (translating) box.append(newLanguageSelect());
    box.append(
      el('button', {
        class: 'btn', id: 'translate', type: 'button', hidden: translating,
        text: t('translate') + (count ? ' (' + fmt(count) + ')' : ''),
        on: { click: function () { setTranslating(true); } }
      }),
      el('button', {
        class: 'btn', id: 'add-icon', type: 'button', text: t('addIcon'),
        on: { click: openHelp }
      })
    );
  }

  function newLanguageSelect() {
    var box = el('select', {
      id: 't-new', 'aria-label': t('newLanguageLabel'),
      on: { change: function (e) { if (e.target.value) setLang(e.target.value); } }
    }, [el('option', { value: '', text: t('newLanguage') })]);
    Object.keys(PROPOSABLE)
      .filter(function (code) { return !isOpen(code) && code !== lang; })
      .sort(function (a, b) { return PROPOSABLE[a].localeCompare(PROPOSABLE[b]); })
      .forEach(function (code) { box.appendChild(el('option', { value: code, text: PROPOSABLE[code] })); });
    return box;
  }

  // Percentages need every names file, so they load only when someone reaches for the list.
  var allNames;

  function loadAllNames() {
    if (!loaded) return;
    allNames = allNames || Promise.all(Object.keys(languages).map(loadNames));
    allNames.then(function () {
      var box = $('lang');
      if (!box) return;
      Array.prototype.forEach.call(box.options, function (option) { option.textContent = languageLabel(option.value); });
    });
  }

  function languageOptions() {
    var codes = Object.keys(languages);
    Object.keys(drafts).concat(lang).forEach(function (code) {
      if (codes.indexOf(code) < 0) codes.push(code);
    });
    return codes.sort(function (a, b) { return languageName(a).localeCompare(languageName(b)); });
  }

  function languageLabel(code) {
    if (!isOpen(code)) return languageName(code) + ' (' + t('notOpenTag') + ')';
    if (!loaded || !own(names, code)) return languageName(code);
    var cover = coverage(code);
    return languageName(code) + ' · ' + pct(cover.done, cover.total);
  }

  function pickLanguage(requested, open) {
    var candidates = [requested, storeGet(STORE_LANG)];
    for (var i = 0; i < candidates.length; i++) {
      var code = candidates[i];
      if (code && (open.indexOf(code) >= 0 || own(PROPOSABLE, code))) return code;
    }
    var browser = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (var j = 0; j < browser.length; j++) {
      var wanted = String(browser[j]).toLowerCase();
      var match = open.filter(function (c) { return c.toLowerCase() === wanted; })[0]
        || open.filter(function (c) { return c.toLowerCase().split('-')[0] === wanted.split('-')[0]; })[0];
      if (match) return match;
    }
    return open.indexOf('en') >= 0 ? 'en' : open[0] || 'en';
  }

  function loadNames(code) {
    if (own(names, code)) return Promise.resolve();
    if (!isOpen(code)) {
      names[code] = {};
      return Promise.resolve();
    }
    return fetch('names/' + encodeURIComponent(code) + '.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (data) {
        var clean = {};
        if (data && typeof data === 'object') {
          Object.keys(data).forEach(function (key) {
            if (typeof data[key] === 'string' && data[key]) clean[key] = data[key];
          });
        }
        names[code] = clean;
        pruneDrafts(code);
      });
  }

  var langRequest = 0;

  function setLang(code) {
    var request = ++langRequest;
    storeSet(STORE_LANG, code);
    return loadNames(code).then(function () {
      if (request !== langRequest) return;
      lang = code;
      refresh();
    });
  }

  function refresh() {
    applyStatic();
    renderFooter();
    relabel();
    renderTools();
    renderBar();
    if (!loaded) return;
    $('total').textContent = iconCount(root.count);
    select(state.node);
  }

  /* ---------- translate mode ---------- */

  function setTranslating(on) {
    if (!on && saveTimer) saveDrafts();
    translating = on;
    document.body.classList.toggle('translating', on);
    refresh();
    if (on) {
      var first = window.matchMedia('(pointer:fine)').matches ? $('grid').querySelector('input') : null;
      (first || $('t-only')).focus({ preventScroll: true });
    } else if ($('translate')) {
      $('translate').focus();
    }
  }

  function renderBar() {
    var bar = $('tbar');
    bar.hidden = !translating;
    bar.textContent = '';
    if (!translating) return;
    var only = el('input', {
      type: 'checkbox', id: 't-only', checked: state.untranslated,
      on: {
        change: function (e) {
          state.untranslated = e.target.checked;
          relabel();
          renderTree();
          filter();
          $('main').scrollTop = 0;
        }
      }
    });
    var onlyLabel = el('label', { class: 'check' }, [only, ' ' + t('onlyUntranslated')]);

    bar.append(
      el('div', { class: 'tbar-state' }, [
        el('strong', { dir: 'auto', text: t('translating', { lang: languageName(lang) }) }),
        el('span', { id: 't-progress', class: 'muted' }),
        el('progress', { id: 't-meter', max: 1, value: 0, 'aria-hidden': 'true' }),
        el('span', { id: 't-drafts', class: 'muted', 'aria-live': 'polite' })
      ]),
      el('div', { class: 'tbar-tools' }, [
        onlyLabel,
        el('button', { class: 'btn primary', id: 't-submit', type: 'button', text: t('submit'), on: { click: openSend } }),
        el('button', { class: 'btn', id: 't-done', type: 'button', text: t('done'), on: { click: function () { setTranslating(false); } } })
      ])
    );
    if (!isOpen(lang)) bar.append(el('p', { class: 'tbar-note', text: t('notOpenBar', { lang: languageName(lang) }) }));
    renderStatus();
  }

  function renderStatus() {
    var btn = $('translate');
    var count = draftCount(lang);
    if (btn) btn.textContent = t('translate') + (count ? ' (' + fmt(count) + ')' : '');
    if (!translating || !$('t-drafts')) return;
    var cover = coverage(lang);
    var table = own(names, lang) ? names[lang] : {};
    var added = 0;
    Object.keys(draftsOf(lang)).forEach(function (key) { if (!own(table, key) && own(known, key) && (own(byKey, key) || own(byNode, key))) added++; });
    var done = cover.done + added;
    $('t-progress').textContent = t('progress', { done: fmt(done), total: fmt(cover.total), pct: pct(done, cover.total) });
    $('t-meter').max = cover.total || 1;
    $('t-meter').value = done;
    var text = !count ? '' : !storageOk ? t('draftsVolatile', { n: fmt(count) }) : count === 1 ? t('draftSaved') : t('draftsSaved', { n: fmt(count) });
    $('t-drafts').textContent = text;
    $('t-submit').textContent = count ? t('submitCount', { n: fmt(count) }) : t('submit');
  }

  /* ---------- submit, as set by docs/CONTRIBUTION-CONTRACT.md ---------- */

  function issueUrl(body) {
    var base = REPO + '/issues/new?template=translation.yml&title=' + encodeURIComponent('[translation] ' + body.lang);
    var full = base + '&payload=' + encodeURIComponent(JSON.stringify(body));
    return full.length <= URL_LIMIT ? { url: full, base: base, prefilled: true } : { url: base, base: base, prefilled: false };
  }

  function splitParts(code, entries) {
    var empty = JSON.stringify({ lang: code, names: {} }).length;
    var parts = [];
    var chunk = {};
    var size = empty;
    var count = 0;
    Object.keys(entries).sort().forEach(function (key) {
      var cost = JSON.stringify(key).length + JSON.stringify(entries[key]).length + 2;
      if (count && size + cost > JSON_LIMIT) {
        parts.push({ lang: code, names: chunk });
        chunk = {};
        size = empty;
        count = 0;
      }
      chunk[key] = entries[key];
      size += cost;
      count++;
    });
    if (count) parts.push({ lang: code, names: chunk });
    return parts;
  }

  function collect() {
    var table = draftsOf(lang);
    var good = {};
    var problems = [];
    var stale = 0;
    Object.keys(table).forEach(function (key) {
      if (!own(known, key)) { stale++; return; }
      var value = table[key].trim();
      if (!value || value === published(key)) return;
      var problem = nameProblem(value);
      if (problem) problems.push({ key: key, value: value, problem: problem });
      else good[key] = value;
    });
    return { good: good, problems: problems, stale: stale };
  }

  function dialogHead(titleKey, dlg) {
    return el('div', { class: 'dlg-top' }, [
      el('h2', { text: t(titleKey) }),
      el('button', {
        class: 'icon-btn', type: 'button', 'aria-label': t('close'), title: t('close') + ' (Esc)', text: '✕',
        on: { click: function () { dlg.close(); } }
      })
    ]);
  }

  function para(text, cls) {
    return el('p', { text: text, class: cls || '' });
  }

  function linkBtn(text, href, cls, onClick) {
    var props = { class: 'btn ' + (cls || ''), href: href, target: '_blank', rel: 'noopener', text: text };
    if (onClick) props.on = { click: onClick };
    return el('a', props);
  }

  function openSend() {
    if (saveTimer) saveDrafts();
    renderSend();
    var dlg = $('send');
    if (!dlg.open) dlg.showModal();
  }

  function renderSend() {
    var dlg = $('send');
    var box = $('send-body');
    box.textContent = '';
    box.append(dialogHead('sendTitle', dlg));
    var data = collect();
    var count = Object.keys(data.good).length;
    var langName = languageName(lang);

    if (!count && !data.problems.length) {
      box.append(para(t('sendNothing')));
      if (data.stale) box.append(para(t('sendStale', { n: fmt(data.stale) }), 'muted'));
      return;
    }

    box.append(para(count === 1 ? t('sendSummaryOne', { lang: langName }) : t('sendSummary', { n: fmt(count), lang: langName })));
    if (data.stale) box.append(para(t('sendStale', { n: fmt(data.stale) }), 'muted'));

    if (!isOpen(lang)) {
      var line = '"' + lang + '": "' + langName + '"';
      var lineInput = el('input', { id: 'send-line', readOnly: true, value: line, dir: 'ltr', 'aria-label': t('sendLine') });
      box.append(
        para(t('sendNotOpen', { lang: langName })),
        el('div', { class: 'row' }, [
          lineInput,
          el('button', { type: 'button', text: t('sendCopy'), on: { click: function (e) { copy(line, e.target); } } })
        ]),
        el('div', { class: 'actions' }, [linkBtn(t('sendEdit'), REPO + '/edit/main/names/languages.json', 'primary')])
      );
      box.append(discardBlock());
      return;
    }

    if (data.problems.length) {
      box.append(para(t('sendProblems')));
      var ul = el('ul', { class: 'problems' });
      data.problems.slice(0, 20).forEach(function (p) {
        var on = own(byKey, p.key) || own(byNode, p.key);
        ul.append(el('li', null, [
          el('span', { class: 'prob-text' }, [
            el('code', { dir: 'auto', text: p.value }),
            el('small', { text: t(p.problem) + (on ? '' : ' ' + t('sendOffPage')) })
          ]),
          on ? el('button', { class: 'btn', type: 'button', text: t('sendShow'), on: { click: function () { jumpTo(p.key); } } }) : null
        ]));
      });
      box.append(ul);
      box.append(discardBlock());
      return;
    }

    var parts = splitParts(lang, data.good);
    var built = parts.map(function (body) { return { body: body, text: JSON.stringify(body), issue: issueUrl(body) }; });
    if (built.length === 1 && built[0].issue.prefilled) {
      box.append(el('div', { class: 'actions' }, [linkBtn(t('sendOpen'), built[0].issue.url, 'primary')]));
    } else {
      var area = el('textarea', { id: 'send-data', readOnly: true, rows: 6, dir: 'ltr', spellcheck: false });
      var areaLabel = el('label', { htmlFor: 'send-data', text: t('sendData') });
      var firstManual = built.filter(function (b) { return !b.issue.prefilled; })[0];
      area.value = firstManual ? firstManual.text : '';
      box.append(para(built.length > 1 ? t('sendParts', { n: fmt(built.length) }) : t('sendLong')));
      if (built.length === 1) {
        box.append(el('div', { class: 'actions' }, [
          linkBtn(t('sendCopyOpen'), built[0].issue.base, 'primary', function (e) { copy(built[0].text, e.currentTarget); })
        ]));
      } else {
        var rows = el('ul', { class: 'parts' });
        built.forEach(function (b, i) {
          var label = t('sendPart', { i: fmt(i + 1), n: fmt(built.length), count: fmt(Object.keys(b.body.names).length) });
          rows.append(el('li', null, [
            el('span', { text: label }),
            b.issue.prefilled
              ? linkBtn(t('sendPartLink'), b.issue.url)
              : linkBtn(t('sendCopyOpen'), b.issue.base, '', function (e) {
                area.value = b.text;
                copy(b.text, e.currentTarget);
              })
          ]));
        });
        box.append(rows);
      }
      box.append(
        el('div', { class: 'field' }, [
          el('div', { class: 'field-top' }, [
            areaLabel,
            el('button', { class: 'btn', type: 'button', text: t('sendCopy'), on: { click: function (e) { copy(area.value, e.target); } } })
          ]),
          area
        ])
      );
    }
    box.append(para(t('sendNeeds')), para(t('sendNext'), 'muted'), para(t('sendKeep'), 'muted'), discardBlock());
  }

  function discardBlock() {
    var count = draftCount(lang);
    var armed = false;
    var btn = el('button', {
      class: 'btn quiet', type: 'button', text: t('discard'),
      on: {
        click: function () {
          if (!armed) {
            armed = true;
            btn.textContent = t('discardSure', { n: fmt(count) });
            btn.classList.add('danger');
            return;
          }
          delete drafts[lang];
          saveDrafts();
          $('send').close();
          refresh();
        },
        blur: function () {
          armed = false;
          btn.textContent = t('discard');
          btn.classList.remove('danger');
        }
      }
    });
    return el('div', { class: 'actions end' }, [btn]);
  }

  function jumpTo(key) {
    $('send').close();
    state.untranslated = false;
    state.q = '';
    $('q').value = '';
    var it = own(byKey, key) ? byKey[key] : null;
    var folder = own(byNode, key) ? byNode[key] : null;
    if (!it && !folder) return;
    renderBar();
    select(it ? it.dir : folder.path);
    var input = it ? null : $('folder-in');
    if (it) {
      var index = list.indexOf(it);
      while (index >= shown) more();
      input = $('grid').querySelector('figure[data-i="' + index + '"] input');
    }
    if (input) { input.focus(); input.select(); }
  }

  /* ---------- contribute dialog ---------- */

  function openHelp() {
    var dlg = $('help');
    var box = $('help-body');
    box.textContent = '';
    box.append(
      dialogHead('helpTitle', dlg),
      el('section', null, [
        el('h3', { text: t('helpIconTitle') }),
        para(t('helpIcon')),
        el('ol', { class: 'steps' }, (ui().helpIconSteps || UI.en.helpIconSteps).map(function (text) { return el('li', { text: text }); })),
        para(t('helpIconTerms'), 'muted'),
        el('div', { class: 'actions' }, [
          linkBtn(t('helpIconGo'), REPO + '/blob/main/CONTRIBUTING.md', 'primary'),
          linkBtn(t('helpRepo'), REPO)
        ])
      ]),
      el('section', null, [
        el('h3', { text: t('helpTranslateTitle') }),
        para(t('helpTranslate')),
        el('div', { class: 'actions' }, [
          el('button', {
            class: 'btn primary', type: 'button', text: t('helpTranslateGo'),
            on: { click: function () { dlg.close(); setTranslating(true); } }
          })
        ])
      ]),
      el('section', null, [
        el('h3', { text: t('helpRightsTitle') }),
        para(t('helpRights'), 'muted'),
        el('div', { class: 'actions' }, [linkBtn(t('helpRightsGo'), REPO + '/blob/main/ASSETS.md')])
      ])
    );
    if (!dlg.open) dlg.showModal();
  }

  /* ---------- wiring ---------- */

  function setNav(on) {
    document.body.classList.toggle('nav', on);
    $('toggle').setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  $('d-img').addEventListener('load', function (e) {
    $('d-dim').textContent = e.target.naturalWidth + '×' + e.target.naturalHeight;
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    btn.addEventListener('click', function () { copy($(btn.dataset.copy).value, btn); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.row input'), function (input) {
    input.addEventListener('focus', function () { input.select(); });
  });

  $('d-close').addEventListener('click', function () { $('dlg').close(); });
  $('d-prev').addEventListener('click', function () { step(-1); });
  $('d-next').addEventListener('click', function () { step(1); });
  Array.prototype.forEach.call(document.querySelectorAll('dialog'), function (dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  });
  $('dlg').addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  $('grid').addEventListener('click', function (e) {
    var fig = e.target.closest('figure');
    if (!fig) return;
    if (translating && e.target.tagName !== 'IMG') return;
    show(Number(fig.dataset.i));
  });
  $('grid').addEventListener('keydown', function (e) {
    if (translating) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
        if (e.altKey) show(Number(e.target.closest('figure').dataset.i));
        else moveFocus(e.target, e.shiftKey ? -1 : 1);
      }
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var fig = e.target.closest('figure');
    if (!fig) return;
    e.preventDefault();
    show(Number(fig.dataset.i));
  });
  $('grid').addEventListener('input', function (e) {
    if (e.target.tagName === 'INPUT') commitInput(e.target);
  });
  // A cleared field cannot delete a published name, so show that name again.
  $('grid').addEventListener('focusout', function (e) {
    if (e.target.tagName !== 'INPUT' || e.target.value.trim()) return;
    e.target.value = published(e.target.dataset.key);
    markInput(e.target);
  });

  var qTimer;
  $('q').addEventListener('input', function (e) {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () {
      state.q = e.target.value.trim();
      writeHash();
      filter();
    }, 150);
  });

  $('toggle').addEventListener('click', function () { setNav(!document.body.classList.contains('nav')); });
  $('main').addEventListener('click', function () { setNav(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('nav')) {
      setNav(false);
      $('toggle').focus();
    }
  });
  $('skip').addEventListener('click', function (e) {
    e.preventDefault();
    $('main').focus();
  });
  window.addEventListener('pagehide', function () { if (saveTimer) saveDrafts(); });

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting && shown < list.length) more();
  }, { root: $('main'), rootMargin: '600px' }).observe($('more'));

  /* ---------- start ---------- */

  var params = readHash();
  $('q').value = state.q;
  lang = pickLanguage(params.get('lang'), Object.keys(UI));
  applyStatic();
  renderFooter();
  renderTools();

  var languagesReady = fetch('names/languages.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (data) {
      if (data && typeof data === 'object' && Object.keys(data).length) {
        var clean = {};
        Object.keys(data).forEach(function (code) { if (typeof data[code] === 'string') clean[code] = data[code]; });
        languages = clean;
      }
      loadDrafts();
      var picked = pickLanguage(params.get('lang'), Object.keys(languages));
      if (picked !== lang) {
        lang = picked;
        applyStatic();
        renderFooter();
      }
      if (params.get('lang')) storeSet(STORE_LANG, lang);
      return Promise.all([loadNames('en'), loadNames(lang)]);
    });

  Promise.all([fetch(BASE + 'index.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }), languagesReady])
    .then(function (results) {
      build(results[0].dirs || {});
      loaded = true;
      translating = params.get('translate') === '1';
      document.body.classList.toggle('translating', translating);
      refresh();
      if (params.get('contribute') === '1') openHelp();
    })
    .catch(function () {
      $('empty').hidden = false;
      $('empty').textContent = t('failed');
    });

})();
