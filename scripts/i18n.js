// ------------------------------------------------------
// constante de idiomas (en / es / fr)
// ------------------------------------------------------

const LANGS = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' }
];

const I18N = {
  en: {
    'meta.title': 'My Demon List | Geometry Dash',
    'meta.desc': 'Create and organize your personal Geometry Dash demon lists: tier, attempts, win date, favorites and your stats.',

    'common.ok': 'OK', 'common.cancel': 'Cancel', 'common.save': 'Save',
    'common.delete': 'Delete', 'common.noPhoto': 'No image', 'o': 'or',
    'dlg.alert': 'Notice', 'dlg.confirm': 'Confirm',

    'header.home': 'Home', 'header.homeTitle': 'Go home', 'header.settings': 'Settings',
    'header.language': 'Language', 'header.login': 'Log in',

    'profile.edit': 'Edit profile', 'profile.id': 'ID: {id}',
    'stats.demons': 'Demons', 'stats.moons': 'Moons', 'stats.diamonds': 'Diamonds', 'stats.stars': 'Stars',
    'stats.userCoins': 'User coins', 'stats.secretCoins': 'Secret coins',
    'stats.edit': 'Click to edit', 'stats.value': 'Value:', 'stats.infoBtn': 'Information', 'stats.infoTitle': 'About these stats',
    'stats.infoText': 'For now these stats are manual: click any of them to set its value however you like. Soon they will be linked to your Geometry Dash account.',

    'lists.title': 'My demon lists', 'lists.count': 'Total lists: {n}', 'lists.add': '+ Add list',
    'lists.filterFav': 'Filter favorites', 'lists.emptyFav': 'You have no lists marked as favorite.',
    'lists.empty': 'Your lists panel is empty. Add your first list!',
    'list.edit': 'Edit list', 'list.view': 'View', 'list.by': 'By {name}',
    'list.info': 'Demons: {n} · Hardest: {hardest}', 'list.favorite': 'Favorite list',

    'view.subtitle': 'Created by {name} · {n} demons', 'view.filters': 'Filters', 'view.difficulty': 'Difficulty',
    'view.all': 'All', 'view.favFilter': 'Filter favorites', 'view.onlyFav': 'Favorites only',
    'view.search': 'Search level...', 'view.lock': 'Lock/unlock dragging', 'view.sort': 'Sort by',
    'view.addDemon': '+ Demon', 'view.top': 'Back to top',
    'view.noMatch': 'No demon matches the filters', 'view.noMatchText': 'Change the search or the filters to see more results.',
    'view.empty': 'This list has no demons yet', 'view.emptyText': 'Use "+ Demon" to add your first demon.',
    'sort.custom': 'Custom order', 'sort.tier_desc': 'Tier (highest)', 'sort.tier_asc': 'Tier (lowest)',
    'sort.attempts_desc': 'Most attempts', 'sort.attempts_asc': 'Fewest attempts',
    'sort.recent': 'Newest date', 'sort.oldest': 'Oldest date',
    'card.edit': 'Edit demon', 'card.addBelow': 'Add demon below', 'card.showcase': 'Watch showcase',
    'card.publishedBy': 'published by {name}', 'card.tier': 'Tier:', 'card.attempts': 'Attempts:', 'card.date': 'Date:',

    'profile.editTitle': '✎ Edit profile', 'profile.username': 'Username:', 'profile.name': 'your name',
    'profile.uploadImg': 'Upload image', 'profile.removeImg': 'Remove image',
    'profile.uploadBanner': 'Upload banner', 'profile.removeBanner': 'Remove banner',
    'profile.bannerColor': 'Change color',

    'profile.country': 'Nationality:', 'profile.countryPh': 'Search your country...',
    'profile.editBanner': 'Edit banner', 'profile.editAvatar': 'Edit picture',
    'color.title': 'Pick a color', 'color.reset': 'Reset', 'color.apply': 'Apply',

    'login.title': 'Log in', 'login.user': 'Geometry Dash username or ID:', 'login.submit': 'Log in', 'login.soon': 'Coming soon.',
    'login.infoBtn': 'Information', 'login.infoTitle': 'Log in',
    'login.infoText': 'We are still working on this feature. It will be available in upcoming versions :)',

    'listm.new': 'Create new list', 'listm.edit': 'Edit list', 'listm.create': 'Create list', 'listm.saveChanges': 'Save',
    'listm.banner': 'List banner or image:', 'listm.upload': 'Upload banner', 'listm.remove': 'Remove banner',
    'listm.name': 'List name:', 'listm.import': 'Import list', 'listm.export': 'Export list',
    'listm.favTitle': 'Mark as favorite', 'listm.invalidFile': 'The JSON file is not a valid list.',
    'listm.importOk': 'List imported successfully.', 'listm.importErr': 'Error while processing the JSON file.',
    'listm.replaceConfirm': 'This will replace the demons of this list with the ones in the file. Continue?',
    'listm.deleteConfirm': 'Delete "{title}" and all its demons?',

    'demon.add': 'Add demon', 'demon.edit': 'Edit demon', 'demon.thumbHint': 'Video thumbnail / default icon:',
    'demon.iconOn': 'Default icon: on', 'demon.iconOff': 'Default icon: off', 'demon.name': 'Name:',
    'demon.creator': 'Creator:', 'demon.difficulty': 'Difficulty:', 'demon.tier': 'Tier:', 'demon.attempts': 'Attempts:',
    'demon.winDate': 'Win date:', 'demon.peak': 'Peak position:', 'demon.save': 'Save', 'demon.create': 'Add demon',
    'settings.title': 'Settings', 'settings.subtitle': 'Appearance and local data', 'settings.theme': 'Theme', 'settings.bg': 'Background',
    'settings.upload': 'Upload image', 'settings.removeImg': 'Remove image', 'settings.bgColor': 'Background color',
    'settings.bgColorReset': 'Use theme color',
    'settings.bgHint': 'The image is shown above the color. It is stored in this browser, so use lightweight images.',
    'settings.data': 'Data', 'settings.dataHint': 'Everything is stored only in this browser. Export a copy before deleting or importing your data.',
    'settings.export': 'Export all', 'settings.import': 'Import (overwrites everything)', 'settings.deleteAll': 'Delete all data',
    'settings.deleteConfirm': 'ALL your data on this device will be deleted. Continue?',
    'settings.deletePrompt': 'Type DELETE to confirm', 'settings.deleteWord': 'DELETE',
    'settings.invalidFile': 'The file is not valid.', 'settings.incompatible': 'The file does not match or is not compatible.',
    'settings.importConfirm': 'This will replace ALL your current data with the file contents. Continue?',
    'settings.importTooBig': 'Import failed, the file is too large.',

    'theme.blue': 'Blue', 'theme.white': 'White', 'theme.dark': 'Dark', 'theme.purple': 'Purple', 'theme.infernal': 'Infernal',
    'theme.discord': 'Discord', 'theme.atardecer': 'Sunset', 'theme.neon': 'Neon', 'theme.bosque': 'Forest', 'theme.rosa': 'Pastel pink',
    'theme.rosa-dark': 'Dark pink', 'theme.halloween': 'Halloween',

    'storage.full': 'Changes could not be saved: the browser storage is full. Try smaller images.'
  },

  es: {
    'meta.title': 'My Demon List | Geometry Dash',
    'meta.desc': 'Crea y organiza tus listas personales de demons de Geometry Dash: tier, intentos, fecha de victoria, favoritos y tus estadísticas.',

    'common.ok': 'Aceptar', 'common.cancel': 'Cancelar', 'common.save': 'Guardar',
    'common.delete': 'Eliminar', 'common.noPhoto': 'Sin imagen',
    'dlg.alert': 'Aviso', 'dlg.confirm': 'Confirmar', 'o': 'o',

    'header.home': 'Inicio', 'header.homeTitle': 'Ir al inicio', 'header.settings': 'Ajustes',
    'header.language': 'Idioma', 'header.login': 'Iniciar sesión',

    'profile.edit': 'Editar perfil', 'profile.id': 'ID: {id}',
    'stats.demons': 'Demons', 'stats.moons': 'Moons', 'stats.diamonds': 'Diamonds', 'stats.stars': 'Stars',
    'stats.userCoins': 'User coins', 'stats.secretCoins': 'Secret coins',
    'stats.edit': 'Clic para editar', 'stats.value': 'Valor:', 'stats.infoBtn': 'Información', 'stats.infoTitle': 'Sobre estas estadísticas',
    'stats.infoText': 'Por ahora estas estadísticas son manuales: haz clic en cualquiera para cambiar su valor a tu gusto. Próximamente se vincularán a tu cuenta de Geometry Dash.',

    'lists.title': 'Mis listas demon', 'lists.count': 'Listas totales: {n}', 'lists.add': '+ Añadir lista',
    'lists.filterFav': 'Filtrar favoritos', 'lists.emptyFav': 'No tienes listas marcadas como favoritas.',
    'lists.empty': 'Tu panel de listas está vacío. ¡Agrega tu primera lista!',
    'list.edit': 'Editar lista', 'list.view': 'Ver', 'list.by': 'Por {name}',
    'list.info': 'Demons: {n} · Hardest: {hardest}', 'list.favorite': 'Lista favorita',

    'view.subtitle': 'Creada por {name} · {n} demons', 'view.filters': 'Filtros', 'view.difficulty': 'Dificultad',
    'view.all': 'Todas', 'view.favFilter': 'Filtrar favoritos', 'view.onlyFav': 'Solo favoritos',
    'view.search': 'Buscar nivel...', 'view.lock': 'Bloquear/desbloquear arrastre', 'view.sort': 'Ordenar por',
    'view.addDemon': '+ Demon', 'view.top': 'Volver arriba',
    'view.noMatch': 'Ningún demon coincide con los filtros', 'view.noMatchText': 'Cambia la búsqueda o los filtros para ver más resultados.',
    'view.empty': 'Esta lista aún no tiene demons', 'view.emptyText': 'Usa "+ Demon" para añadir tu primer demon.',
    'sort.custom': 'Orden personalizado', 'sort.tier_desc': 'Tier (más alto)', 'sort.tier_asc': 'Tier (más bajo)',
    'sort.attempts_desc': 'Más intentos', 'sort.attempts_asc': 'Menos intentos',
    'sort.recent': 'Fecha más reciente', 'sort.oldest': 'Fecha más antigua',
    'card.edit': 'Editar demon', 'card.addBelow': 'Agregar demon debajo', 'card.showcase': 'Ver showcase',
    'card.publishedBy': 'publicado por {name}', 'card.tier': 'Tier:', 'card.attempts': 'Intentos:', 'card.date': 'Fecha:',

    'profile.editTitle': 'Editar perfil', 'profile.username': 'Nombre de usuario:', 'profile.uploadImg': 'Subir imagen',
    'profile.removeImg': 'Quitar imagen', 'profile.uploadBanner': 'Subir banner', 'profile.removeBanner': 'Quitar banner',
    'profile.bannerColor': 'Cambiar color', 'profile.name': 'tu nombre',

    'profile.editBanner': 'Editar banner', 'profile.editAvatar': 'Editar imagen',
    'profile.country': 'Nacionalidad:', 'profile.countryPh': 'Busca tu país...',
    'color.title': 'Elegir color', 'color.reset': 'Restablecer', 'color.apply': 'Aplicar',

    'login.title': 'Iniciar sesión', 'login.user': 'Usuario o ID de Geometry Dash:', 'login.submit': 'Iniciar sesión', 'login.soon': 'Próximamente.',
    'login.infoBtn': 'Información', 'login.infoTitle': 'Iniciar sesión',
    'login.infoText': 'Aún estamos trabajando en esta función. Estará disponible en próximas versiones :)',

    'listm.new': 'Crear nueva lista', 'listm.edit': 'Editar lista', 'listm.create': 'Crear lista', 'listm.saveChanges': 'Guardar',
    'listm.banner': 'Banner o imagen de lista:', 'listm.upload': 'Subir banner', 'listm.remove': 'Eliminar banner',
    'listm.name': 'Nombre de lista:', 'listm.import': 'Importar lista', 'listm.export': 'Exportar lista',
    'listm.favTitle': 'Marcar como favorita', 'listm.invalidFile': 'El archivo JSON no tiene un formato válido de lista.',
    'listm.importOk': 'Lista importada con éxito.', 'listm.importErr': 'Error al procesar el archivo JSON.',
    'listm.replaceConfirm': 'Esto reemplazará los demons de esta lista por los del archivo. ¿Continuar?',
    'listm.deleteConfirm': '¿Eliminar "{title}" y todos sus demons?',

    'demon.add': 'Agregar demon', 'demon.edit': 'Editar demon', 'demon.thumbHint': 'Miniatura de video / icono por defecto:',
    'demon.iconOn': 'Icono por defecto: on', 'demon.iconOff': 'Icono por defecto: off', 'demon.name': 'Nombre:',
    'demon.creator': 'Creador:', 'demon.difficulty': 'Dificultad:', 'demon.tier': 'Tier:', 'demon.attempts': 'Intentos:',
    'demon.winDate': 'Fecha de victoria:', 'demon.peak': 'Máxima posición:', 'demon.save': 'Guardar', 'demon.create': 'Agregar demon',

    'settings.title': 'Ajustes', 'settings.subtitle': 'Apariencia y datos locales', 'settings.theme': 'Tema', 'settings.bg': 'Fondo',
    'settings.upload': 'Subir imagen', 'settings.removeImg': 'Quitar imagen', 'settings.bgColor': 'Color de fondo',
    'settings.bgColorReset': 'Usar color del tema',
    'settings.bgHint': 'La imagen se ve por encima del color. Se guarda en este navegador, usa imágenes ligeras.',
    'settings.data': 'Datos', 'settings.dataHint': 'Todo se guarda solo en este navegador. Exporta una copia antes de borrar o importar tus datos.',
    'settings.export': 'Exportar todo', 'settings.import': 'Importar (sobrescribe todo)', 'settings.deleteAll': 'Borrar todos los datos',
    'settings.deleteConfirm': 'Se borrarán TODOS tus datos en este dispositivo. ¿Continuar?',
    'settings.deletePrompt': 'Escribe BORRAR para confirmar', 'settings.deleteWord': 'BORRAR',
    'settings.invalidFile': 'El archivo no es válido.', 'settings.incompatible': 'El archivo no coincide o no es compatible.',
    'settings.importConfirm': 'Esto reemplazará TODOS tus datos actuales por los del archivo. ¿Continuar?',
    'settings.importTooBig': 'Error al importar, archivo demasiado grande.',

    'theme.blue': 'Azul', 'theme.white': 'Blanco', 'theme.dark': 'Dark', 'theme.purple': 'Púrpura', 'theme.infernal': 'Infernal',
    'theme.discord': 'Discord', 'theme.atardecer': 'Atardecer', 'theme.neon': 'Neón', 'theme.bosque': 'Bosque', 'theme.rosa': 'Rosa pastel',
    'theme.rosa-dark': 'Rosa Oscuro', 'theme.halloween': 'Halloween',

    'storage.full': 'No se pudieron guardar los cambios: el almacenamiento del navegador está lleno. Prueba con imágenes más pequeñas.'
  },

  fr: {
    'meta.title': 'My Demon List | Geometry Dash',
    'meta.desc': 'Créez et organisez vos listes personnelles de demons Geometry Dash : tier, essais, date de victoire, favoris et vos statistiques.',

    'common.ok': 'Ok', 'common.cancel': 'Annuler', 'common.save': 'Enregistrer',
    'common.delete': 'Supprimer', 'common.noPhoto': 'Sans image',
    'dlg.alert': 'Avis', 'dlg.confirm': 'Confirmer', 'o': 'ou',

    'header.home': 'Accueil', 'header.homeTitle': 'Aller à l\'accueil', 'header.settings': 'Paramètres',
    'header.language': 'Langue', 'header.login': 'Se connecter',

    'profile.edit': 'Modifier le profil', 'profile.id': 'ID : {id}',
    'stats.demons': 'Demons', 'stats.moons': 'Moons', 'stats.diamonds': 'Diamonds', 'stats.stars': 'Stars',
    'stats.userCoins': 'User coins', 'stats.secretCoins': 'Secret coins',
    'stats.edit': 'Cliquer pour modifier', 'stats.value': 'Valeur :', 'stats.infoBtn': 'Informations', 'stats.infoTitle': 'À propos de ces statistiques',
    'stats.infoText': 'Pour l\'instant ces statistiques sont manuelles : cliquez sur l\'une d\'elles pour modifier sa valeur comme vous voulez. Bientôt elles seront liées à votre compte Geometry Dash.',

    'lists.title': 'Mes listes demon', 'lists.count': 'Listes totales : {n}', 'lists.add': '+ Ajouter',
    'lists.filterFav': 'Filtrer les favoris', 'lists.emptyFav': 'Vous n\'avez aucune liste marquée comme favorite.',
    'lists.empty': 'Votre panneau de listes est vide. Ajoutez votre première liste !',
    'list.edit': 'Modifier la liste', 'list.view': 'Voir', 'list.by': 'Par {name}',
    'list.info': 'Demons : {n} · Hardest : {hardest}', 'list.favorite': 'Liste favorite',

    'view.subtitle': 'Créée par {name} · {n} demons', 'view.filters': 'Filtres', 'view.difficulty': 'Difficulté',
    'view.all': 'Toutes', 'view.favFilter': 'Filtrer les favoris', 'view.onlyFav': 'Uniquement favoris',
    'view.search': 'Rechercher un niveau...', 'view.lock': 'Verrouiller/déverrouiller le glissement', 'view.sort': 'Trier par',
    'view.addDemon': '+ Demon', 'view.top': 'Retour en haut',
    'view.noMatch': 'Aucun demon ne correspond aux filtres', 'view.noMatchText': 'Modifiez la recherche ou les filtres pour voir plus de résultats.',
    'view.empty': 'Cette liste ne contient pas encore de demons', 'view.emptyText': 'Utilisez "+ Demon" pour ajouter votre premier demon.',
    'sort.custom': 'Ordre personnalisé', 'sort.tier_desc': 'Tier (plus élevé)', 'sort.tier_asc': 'Tier (plus bas)',
    'sort.attempts_desc': 'Plus d\'essais', 'sort.attempts_asc': 'Moins d\'essais',
    'sort.recent': 'Date la plus récente', 'sort.oldest': 'Date la plus ancienne',
    'card.edit': 'Modifier le demon', 'card.addBelow': 'Ajouter un demon ci-dessous', 'card.showcase': 'Voir le showcase',
    'card.publishedBy': 'publié par {name}', 'card.tier': 'Tier :', 'card.attempts': 'Essais :', 'card.date': 'Date :',

    'profile.editTitle': '✎ Modifier le profil', 'profile.username': 'Nom d\'utilisateur :', 'profile.name': 'ton nom',
    'profile.uploadImg': 'Téléverser image', 'profile.removeImg': 'Supprimer image',
    'profile.uploadBanner': 'Téléverser bannière', 'profile.removeBanner': 'Supprimer bannière',
    'profile.bannerColor': 'Changer de couleur',

    'profile.country': 'Nationalité :', 'profile.countryPh': 'Recherchez votre pays...',
    'profile.editBanner': 'Modifier la bannière', 'profile.editAvatar': 'Modifier l\'image',
    'color.title': 'Choisir une couleur', 'color.reset': 'Réinitialiser', 'color.apply': 'Appliquer',

    'login.title': 'Se connecter', 'login.user': 'Nom d\'utilisateur ou ID Geometry Dash :', 'login.submit': 'Se connecter', 'login.soon': 'Bientôt disponible.',
    'login.infoBtn': 'Informations', 'login.infoTitle': 'Se connecter',
    'login.infoText': 'Nous travaillons encore sur cette fonctionnalité. Elle sera disponible dans les prochaines versions :)',

    'listm.new': 'Créer une nouvelle liste', 'listm.edit': 'Modifier la liste', 'listm.create': 'Créer la liste', 'listm.saveChanges': 'Enregistrer',
    'listm.banner': 'Bannière ou image de la liste :', 'listm.upload': 'Téléverser bannière', 'listm.remove': 'Supprimer bannière',
    'listm.name': 'Nom de la liste :', 'listm.import': 'Importer une liste', 'listm.export': 'Exporter la liste',
    'listm.favTitle': 'Marquer comme favorite', 'listm.invalidFile': 'Le fichier JSON n\'a pas un format de liste valide.',
    'listm.importOk': 'Liste importée avec succès.', 'listm.importErr': 'Erreur lors du traitement du fichier JSON.',
    'listm.replaceConfirm': 'Cela remplacera les demons de cette liste par ceux du fichier. Continuer ?',
    'listm.deleteConfirm': 'Supprimer "{title}" et tous ses demons ?',

    'demon.add': 'Ajouter un demon', 'demon.edit': 'Modifier le demon', 'demon.thumbHint': 'Miniature vidéo / icône par défaut :',
    'demon.iconOn': 'Icône par défaut : activée', 'demon.iconOff': 'Icône par défaut : désactivée', 'demon.name': 'Nom :',
    'demon.creator': 'Créateur :', 'demon.difficulty': 'Difficulté :', 'demon.tier': 'Tier :', 'demon.attempts': 'Essais :',
    'demon.winDate': 'Date de victoire :', 'demon.peak': 'Position maximale :', 'demon.save': 'Enregistrer', 'demon.create': 'Ajouter un demon',

    'settings.title': 'Paramètres', 'settings.subtitle': 'Apparence et données locales', 'settings.theme': 'Thème', 'settings.bg': 'Arrière-plan',
    'settings.upload': 'Téléverser image', 'settings.removeImg': 'Supprimer image', 'settings.bgColor': 'Couleur de fond',
    'settings.bgColorReset': 'Utiliser la couleur du thème',
    'settings.bgHint': 'L\'image s\'affiche au-dessus de la couleur. Elle est stockée dans ce navigateur, utilisez des images légères.',
    'settings.data': 'Données', 'settings.dataHint': 'Tout est enregistré uniquement dans ce navigateur. Exportez une copie avant de supprimer ou d\'importer vos données.',
    'settings.export': 'Tout exporter', 'settings.import': 'Importer (écrase tout)', 'settings.deleteAll': 'Supprimer toutes les données',
    'settings.deleteConfirm': 'TOUTES vos données sur cet appareil seront supprimées. Continuer ?',
    'settings.deletePrompt': 'Tapez SUPPRIMER pour confirmer', 'settings.deleteWord': 'SUPPRIMER',
    'settings.invalidFile': 'Le fichier n\'est pas valide.', 'settings.incompatible': 'Le fichier ne correspond pas ou n\'est pas compatible.',
    'settings.importConfirm': 'Cela remplacera TOUTES vos données actuelles par le contenu du fichier. Continuer ?',
    'settings.importTooBig': 'Échec de l\'importation, le fichier est trop volumineux.',

    'theme.blue': 'Bleu', 'theme.white': 'Blanc', 'theme.dark': 'Sombre', 'theme.purple': 'Violet', 'theme.infernal': 'Infernal',
    'theme.atardecer': 'Coucher de soleil', 'theme.neon': 'Néon', 'theme.bosque': 'Forêt', 'theme.rosa': 'Rose pastel',
    'theme.rosa-dark': 'Rose Sombre', 'theme.discord': 'Discord', 'theme.halloween': 'Halloween',

    'storage.full': 'Les modifications n\'ont pas pu être enregistrées : le stockage du navigateur est plein. Essayez avec des images plus petites.'
  }
};

const currentLang = () => (typeof appSettings !== 'undefined' && I18N[appSettings.lang]) ? appSettings.lang : 'en';

function t(key, vars) {
  let text = I18N[currentLang()][key] ?? I18N.en[key] ?? key;
  if (vars) text = text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return text;
}

function applyLanguage() {
  const lang = currentLang();
  document.documentElement.lang = lang;

  const setMeta = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
  };
  setMeta('meta[name="description"]', t('meta.desc'));
  setMeta('meta[property="og:title"]', t('meta.title'));
  setMeta('meta[property="og:description"]', t('meta.desc'));
  setMeta('meta[property="og:locale"]', lang === 'fr' ? 'fr_FR' : (lang === 'en' ? 'en_US' : 'es_ES'));
  setMeta('meta[name="twitter:title"]', t('meta.title'));
  setMeta('meta[name="twitter:description"]', t('meta.desc'));

  const topBtn = document.getElementById('btnScrollTop');
  if (topBtn) topBtn.title = t('view.top');
}

// ------------------------------------------------------
// constante de paises (cache)
// ------------------------------------------------------

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin',
  'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia',
  'Comoros', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark',
  'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
  'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana',
  'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
  'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Puerto Rico', 'Qatar',
  'Republic of the Congo', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia',
  'Zimbabwe'
];