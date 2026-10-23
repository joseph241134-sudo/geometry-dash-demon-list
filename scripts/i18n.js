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

    'lists.title': 'My demon lists', 'lists.count': 'Total lists: {n}', 'lists.add': '+ Add list',
    'lists.filterFav': 'Filter favorites', 'lists.emptyFav': 'You have no lists marked as favorite.',
    'lists.empty': 'Your lists panel is empty. Add your first list!',
    'list.edit': 'Edit list', 'list.view': 'View', 'list.by': 'By {name}',
    'list.info': 'Demons: {n} · Hardest: {hardest}', 'list.favorite': 'Favorite list',

    'view.subtitle': 'Created by {name} · {n} demons', 'view.filters': 'Filters', 'view.difficulty': 'Difficulty',
    'view.all': 'All', 'view.favFilter': 'Filter favorites', 'view.onlyFav': 'Favorites only',
    'view.search': 'Search level...', 'view.lock': 'Lock/unlock dragging', 'view.sort': 'Sort by',
    'view.addDemon': '+ Demon', 'view.top': 'Back to top',
    'view.thumbYt': 'show demon icons',
    'view.noMatch': 'No demon matches the filters', 'view.noMatchText': 'Change the search or the filters to see more results.',
    'view.empty': 'This list has no demons yet', 'view.emptyText': 'Use "+ Demon" to add your first demon.',
    'sort.custom': 'Custom order', 'sort.tier_desc': 'Tier (highest)', 'sort.tier_asc': 'Tier (lowest)',
    'sort.attempts_desc': 'Most attempts', 'sort.attempts_asc': 'Fewest attempts',
    'sort.recent': 'Newest date', 'sort.oldest': 'Oldest date',
    'card.edit': 'Edit demon', 'card.addBelow': 'Add demon below', 'card.showcase': 'Watch showcase',
    'card.publishedBy': 'published by {name}', 'card.tier': 'Tier:', 'card.attempts': 'Attempts:', 'card.date': 'Date:',

    'profile.editTitle': 'Edit profile', 'profile.username': 'Username:', 'profile.name': 'your name',
    'profile.uploadImg': 'Upload image', 'profile.removeImg': 'Remove image',
    'profile.uploadBanner': 'Upload banner', 'profile.removeBanner': 'Remove banner',
    'profile.bannerColor': 'Change color',

    'profile.country': 'Nationality:', 'profile.countryPh': 'Search your country...',
    'profile.editBanner': 'Edit banner', 'profile.editAvatar': 'Edit picture',
    'color.title': 'Pick a color', 'color.reset': 'Reset', 'color.apply': 'Apply',

    'login.title': 'Link account', 'login.user': 'Geometry Dash username or ID:', 'login.submit': 'Link', 'login.soon': 'Coming soon, with faith.',
    'login.infoBtn': 'Information', 'login.infoTitle': 'Link account',
    'login.infoText': 'We are still working on this feature. It will be available in upcoming versions :)',

    'listm.new': 'Create new list', 'listm.edit': 'Edit list', 'listm.create': 'Create list', 'listm.saveChanges': 'Save',
    'listm.banner': 'List banner or image:', 'listm.upload': 'Upload banner', 'listm.remove': 'Remove banner',
    'listm.name': 'List name:', 'listm.import': 'Import list', 'listm.export': 'Export list',
    'listm.favTitle': 'Mark as favorite', 'listm.invalidFile': 'The JSON file is not a valid list.',
    'listm.importOk': 'List imported successfully.', 'listm.importErr': 'Error while processing the JSON file.',
    'listm.replaceConfirm': 'This will replace the demons of this list with the ones in the file. Continue?',
    'listm.deleteConfirm': 'Delete "{title}" and all its demons?',

    'demon.add': 'Add demon', 'demon.edit': 'Edit demon', 'demon.thumbHint': 'Icon preview - thumbnail:',
    'demon.name': 'Name:', 'demon.yt': 'YouTube URL:', 'demon.position': 'Position:', 
    'demon.creator': 'Creator:', 'demon.difficulty': 'Difficulty:', 'demon.tier': 'Tier:', 'demon.attempts': 'Attempts:',
    'demon.winDate': 'Win date:', 'demon.peak': 'Peak position:', 'demon.save': 'Save', 'demon.create': 'Add demon',
    'settings.title': 'Settings', 'settings.subtitle': 'Appearance and local data', 'settings.theme': 'Theme', 'settings.bg': 'Background',
    'settings.upload': 'Upload image', 'settings.removeImg': 'Remove image', 'settings.bgColor': 'Background color',
    'settings.bgColorReset': 'Use theme color',
    'settings.bgHint': 'The image appears over the color and disables any animation effects from the theme, upload lightweight images.',
    'settings.data': 'Data', 'settings.dataHint': 'Everything is stored solely within this browser. For security reasons, please export a copy of your data before performing any deletions or imports. You can sign in to save your data to the cloud.',
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

    'lists.title': 'Mis listas demon', 'lists.count': 'Listas totales: {n}', 'lists.add': '+ Añadir lista',
    'lists.filterFav': 'Filtrar favoritos', 'lists.emptyFav': 'No tienes listas marcadas como favoritas.',
    'lists.empty': 'Tu panel de listas está vacío. ¡Agrega tu primera lista!',
    'list.edit': 'Editar lista', 'list.view': 'Ver', 'list.by': 'Por {name}',
    'list.info': 'Demons: {n} · Hardest: {hardest}', 'list.favorite': 'Lista favorita',

    'view.subtitle': 'Creada por {name} · {n} demons', 'view.filters': 'Filtros', 'view.difficulty': 'Dificultad',
    'view.all': 'Todas', 'view.favFilter': 'Filtrar favoritos', 'view.onlyFav': 'Solo favoritos',
    'view.search': 'Buscar nivel...', 'view.lock': 'Bloquear/desbloquear arrastre', 'view.sort': 'Ordenar por',
    'view.addDemon': '+ Demon', 'view.top': 'Volver arriba',
    'view.thumbYt': 'Mostrar iconos Demon',
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

    'login.title': 'Vincular cuenta', 'login.user': 'Usuario o ID de Geometry Dash:', 'login.submit': 'Vincular', 'login.soon': 'Próximamente con fe.',
    'login.infoBtn': 'Información', 'login.infoTitle': 'Vincular cuenta',
    'login.infoText': 'Aún estamos trabajando en esta función. Estará disponible en próximas versiones :)',

    'listm.new': 'Crear nueva lista', 'listm.edit': 'Editar lista', 'listm.create': 'Crear lista', 'listm.saveChanges': 'Guardar',
    'listm.banner': 'Banner o imagen de lista:', 'listm.upload': 'Subir banner', 'listm.remove': 'Eliminar banner',
    'listm.name': 'Nombre de lista:', 'listm.import': 'Importar lista', 'listm.export': 'Exportar lista',
    'listm.favTitle': 'Marcar como favorita', 'listm.invalidFile': 'El archivo JSON no tiene un formato válido de lista.',
    'listm.importOk': 'Lista importada con éxito.', 'listm.importErr': 'Error al procesar el archivo JSON.',
    'listm.replaceConfirm': 'Esto reemplazará los demons de esta lista por los del archivo. ¿Continuar?',
    'listm.deleteConfirm': '¿Eliminar "{title}" y todos sus demons?',

    'demon.add': 'Agregar demon', 'demon.edit': 'Editar demon', 'demon.thumbHint': 'Previsualización de icono - miniatura:',
    'demon.name': 'Nombre:', 'demon.yt': 'URL de Youtube:', 'demon.position': 'Posición:', 
    'demon.creator': 'Creador:', 'demon.difficulty': 'Dificultad:', 'demon.tier': 'Tier:', 'demon.attempts': 'Intentos:',
    'demon.winDate': 'Fecha de victoria:', 'demon.peak': 'Máxima posición:', 'demon.save': 'Guardar', 'demon.create': 'Agregar demon',

    'settings.title': 'Ajustes', 'settings.subtitle': 'Apariencia y datos locales', 'settings.theme': 'Tema', 'settings.bg': 'Fondo',
    'settings.upload': 'Subir imagen', 'settings.removeImg': 'Quitar imagen', 'settings.bgColor': 'Color de fondo',
    'settings.bgColorReset': 'Usar color del tema',
    'settings.bgHint': 'La imagen se ve por encima del color y desactiva cualquier efecto de animación del tema, sube imagenes ligeras.',
    'settings.data': 'Datos', 'settings.dataHint': 'Todo se guarda únicamente en su navegador. Por motivos de seguridad, exporte una copia de sus datos antes de eliminar o importar. Puedes iniciar sesión para guardar sus datos en la nube.',
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

    'lists.title': 'Mes listes demon', 'lists.count': 'Listes totales : {n}', 'lists.add': '+ Ajouter',
    'lists.filterFav': 'Filtrer les favoris', 'lists.emptyFav': 'Vous n\'avez aucune liste marquée comme favorite.',
    'lists.empty': 'Votre panneau de listes est vide. Ajoutez votre première liste !',
    'list.edit': 'Modifier la liste', 'list.view': 'Voir', 'list.by': 'Par {name}',
    'list.info': 'Demons : {n} · Hardest : {hardest}', 'list.favorite': 'Liste favorite',

    'view.subtitle': 'Créée par {name} · {n} demons', 'view.filters': 'Filtres', 'view.difficulty': 'Difficulté',
    'view.all': 'Toutes', 'view.favFilter': 'Filtrer les favoris', 'view.onlyFav': 'Uniquement favoris',
    'view.search': 'Rechercher un niveau...', 'view.lock': 'Verrouiller/déverrouiller le glissement', 'view.sort': 'Trier par',
    'view.addDemon': '+ Demon', 'view.top': 'Retour en haut',
    'view.thumbYt': 'Afficher les icônes demon',
    'view.noMatch': 'Aucun demon ne correspond aux filtres', 'view.noMatchText': 'Modifiez la recherche ou les filtres pour voir plus de résultats.',
    'view.empty': 'Cette liste ne contient pas encore de demons', 'view.emptyText': 'Utilisez "+ Demon" pour ajouter votre premier demon.',
    'sort.custom': 'Ordre personnalisé', 'sort.tier_desc': 'Tier (plus élevé)', 'sort.tier_asc': 'Tier (plus bas)',
    'sort.attempts_desc': 'Plus d\'essais', 'sort.attempts_asc': 'Moins d\'essais',
    'sort.recent': 'Date la plus récente', 'sort.oldest': 'Date la plus ancienne',
    'card.edit': 'Modifier le demon', 'card.addBelow': 'Ajouter un demon ci-dessous', 'card.showcase': 'Voir le showcase',
    'card.publishedBy': 'publié par {name}', 'card.tier': 'Tier :', 'card.attempts': 'Essais :', 'card.date': 'Date :',

    'profile.editTitle': 'Modifier le profil', 'profile.username': 'Nom d\'utilisateur :', 'profile.name': 'ton nom',
    'profile.uploadImg': 'Téléverser image', 'profile.removeImg': 'Supprimer image',
    'profile.uploadBanner': 'Téléverser bannière', 'profile.removeBanner': 'Supprimer bannière',
    'profile.bannerColor': 'Changer de couleur',

    'profile.country': 'Nationalité :', 'profile.countryPh': 'Recherchez votre pays...',
    'profile.editBanner': 'Modifier la bannière', 'profile.editAvatar': 'Modifier l\'image',
    'color.title': 'Choisir une couleur', 'color.reset': 'Réinitialiser', 'color.apply': 'Appliquer',

    'login.title': 'Lier un compte', 'login.user': 'Nom d\'utilisateur ou ID Geometry Dash :', 'login.submit': 'Lier', 'login.soon': 'Bientôt disponible, avec foi.',
    'login.infoBtn': 'Informations', 'login.infoTitle': 'Lier un compte',
    'login.infoText': 'Nous travaillons encore sur cette fonctionnalité. Elle sera disponible dans les prochaines versions :)',

    'listm.new': 'Créer une nouvelle liste', 'listm.edit': 'Modifier la liste', 'listm.create': 'Créer la liste', 'listm.saveChanges': 'Enregistrer',
    'listm.banner': 'Bannière ou image de la liste :', 'listm.upload': 'Téléverser bannière', 'listm.remove': 'Supprimer bannière',
    'listm.name': 'Nom de la liste :', 'listm.import': 'Importer une liste', 'listm.export': 'Exporter la liste',
    'listm.favTitle': 'Marquer comme favorite', 'listm.invalidFile': 'Le fichier JSON n\'a pas un format de liste valide.',
    'listm.importOk': 'Liste importée avec succès.', 'listm.importErr': 'Erreur lors du traitement du fichier JSON.',
    'listm.replaceConfirm': 'Cela remplacera les demons de cette liste par ceux du fichier. Continuer ?',
    'listm.deleteConfirm': 'Supprimer "{title}" et tous ses demons ?',

    'demon.add': 'Ajouter un demon', 'demon.edit': 'Modifier le demon', 'demon.thumbHint': `Aperçu de l'icône - miniature :`,
    'demon.name': 'Nom :', 'demon.yt': 'URL Youtube:', 'demon.position': 'Position :',
    'demon.creator': 'Créateur :', 'demon.difficulty': 'Difficulté :', 'demon.tier': 'Tier :', 'demon.attempts': 'Essais :',
    'demon.winDate': 'Date de victoire :', 'demon.peak': 'Position maximale :', 'demon.save': 'Enregistrer', 'demon.create': 'Ajouter un demon',

    'settings.title': 'Paramètres', 'settings.subtitle': 'Apparence et données locales', 'settings.theme': 'Thème', 'settings.bg': 'Arrière-plan',
    'settings.upload': 'Téléverser image', 'settings.removeImg': 'Supprimer image', 'settings.bgColor': 'Couleur de fond',
    'settings.bgColorReset': 'Utiliser la couleur du thème',
    'settings.bgHint': 'L\'image s\'affiche par-dessus la couleur et désactive tout effet d\'animation du thème, Téléversez des images légères.',
    'settings.data': 'Données', 'settings.dataHint': 'Tout est enregistré uniquement dans ce navigateur. Pour des raisons de sécurité, exportez une copie de vos données avant toute suppression ou importation. Vous pouvez vous connecter pour enregistrer vos données dans le cloud.',
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

Object.assign(I18N.en, {
  'auth.text': 'Sign in to save your lists in the cloud and use them on any device.',
  'auth.google': 'Continue with Google',
  'auth.legal': 'By continuing, you accept our {terms} and {privacy}.',
  'legal.privacy': 'Privacy', 'legal.terms': 'Terms of use',
  'footer.text': 'Your space to create your own tier lists and share them.',
  'footer.copy': '© 2026 · Independent project',
  'acc.title': 'Account', 'acc.logged': 'Signed in as {email}', 'acc.signOut': 'Sign out',
  'auth.overwriteTitle': 'Existing account',
  'auth.overwriteText': 'This account already has saved data. If you continue, it will replace the data currently on this device. Do you wish to continue?',
  'auth.overwriteBack': 'Go back', 'auth.overwriteOk': 'Continue',
  'acc.sync': 'Sync now', 'acc.synced': 'Synced.', 'acc.error': 'Could not sync with the cloud. Check your connection.',
  'settings.dataHintCloud': 'Your data is stored in your account. Export a copy for safekeeping before deleting or importing.',
  'settings.deleteConfirmCloud': 'ALL your data, including the cloud copy, will be deleted. Continue?'
});
Object.assign(I18N.es, {
  'auth.text': 'Inicia sesión para guardar tus listas en la nube y usarlas en cualquier dispositivo.',
  'auth.google': 'Continuar con Google',
  'auth.legal': 'Al continuar, aceptas nuestros {terms} y la {privacy}.',
  'legal.privacy': 'Política de privacidad', 'legal.terms': 'Términos de uso',
  'footer.text': 'Crea tus propias listas de niveles y compartelas.',
  'footer.copy': '© 2026 · Proyecto independiente',
  'acc.title': 'Cuenta', 'acc.logged': 'Sesión iniciada como {email}', 'acc.signOut': 'Cerrar sesión',
  'auth.overwriteTitle': 'Cuenta existente',
  'auth.overwriteText': 'Esta cuenta ya tiene datos guardados. Si continúas, reemplazarán los datos que tienes ahora en este dispositivo. ¿deseas continuar?',
  'auth.overwriteBack': 'Volver', 'auth.overwriteOk': 'Continuar',
  'acc.sync': 'Sincronizar ahora', 'acc.synced': 'Sincronizado.', 'acc.error': 'No se pudo sincronizar con la nube. Revisa tu conexión.',
  'settings.dataHintCloud': 'Tus datos se guardan en tu cuenta. Exporta una copia por seguridad antes de borrar o importar.',
  'settings.deleteConfirmCloud': 'Se borrarán TODOS tus datos, incluida la copia en la nube. ¿Continuar?'
});
Object.assign(I18N.fr, {
  'auth.text': 'Connectez-vous pour enregistrer vos listes dans le cloud et les utiliser sur tout appareil.',
  'auth.google': 'Continuer avec Google',
  'auth.legal': 'En continuant, vous acceptez nos {terms} et la {privacy}.',
  'legal.privacy': 'Politique de confidentialité', 'legal.terms': 'Conditions d\'utilisation',
  'footer.text': 'Ton espace pour créer tes propres listes de niveaux et les partager.',
  'footer.copy': '© 2026 · Projet indépendant',
  'acc.title': 'Compte', 'acc.logged': 'Connecté en tant que {email}', 'acc.signOut': 'Se déconnecter',
  'auth.overwriteTitle': 'Compte existant',
  'auth.overwriteText': 'Ce compte contient déjà des données. Si vous continuez, elles remplaceront les données actuellement présentes sur cet appareil. Souhaitez-vous continuer ?',
  'auth.overwriteBack': 'Revenir', 'auth.overwriteOk': 'Continuer',
  'acc.sync': 'Synchroniser', 'acc.synced': 'Synchronisé.', 'acc.error': 'Synchronisation impossible. Vérifiez votre connexion.',
  'settings.dataHintCloud': 'Vos données sont enregistrées dans votre compte. Exportez une copie par mesure de sécurité avant toute suppression ou importation.',
  'settings.deleteConfirmCloud': 'TOUTES vos données, y compris la copie cloud, seront supprimées. Continuer ?'
});

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

  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });

  applyLegalLanguage();   // no-op fuera de privacy.html / terms.html
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

// ======================================================
// Traducción de privacy.html y terms.html
// ======================================================
 
const LEGAL_I18N = {
  en: {
    privacy: {
      title: 'Privacy Policy | My Demon List',
      html: `
        <div style="display: flex; flex-direction: row; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line-1);">
          <div class="square">
            <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
              <path d="M 12 4.22 C 9.43 4.22 7.34 6.31 7.34 8.88 L 7.34 11.23 L 8.98 11.23 L 8.98 8.88 C 8.98 7.21 10.33 5.86 12 5.86 C 13.67 5.86 15.02 7.21 15.02 8.88 L 15.02 11.23 L 16.66 11.23 L 16.66 8.88 C 16.66 6.31 14.57 4.22 12 4.22 Z" />
              <path d="M 7.68 10.37 L 16.32 10.37 C 17.12 10.37 17.76 11.01 17.76 11.81 L 17.76 18.34 C 17.76 19.14 17.12 19.78 16.32 19.78 L 7.68 19.78 C 6.88 19.78 6.24 19.14 6.24 18.34 L 6.24 11.81 C 6.24 11.01 6.88 10.37 7.68 10.37 Z M 12 12.62 C 11.39 12.62 10.9 13.12 10.9 13.73 C 10.9 14.21 11.21 14.62 11.62 14.77 L 11.62 17.04 C 11.62 17.25 11.79 17.42 12 17.42 C 12.21 17.42 12.38 17.25 12.38 17.04 L 12.38 14.77 C 12.79 14.62 13.1 14.21 13.1 13.73 C 13.1 13.12 12.61 12.62 12 12.62 Z" />
            </svg>
          </div>
          <h1>Privacy Policy</h1>
        </div>
        <p class="updated" style="padding-top: 4px;">Last updated: October 23, 2026</p>
 
        <p>My Demon List is an independent project created to organize your own lists of demon levels and keep track of your progress in <span style="font-weight: 600;">Geometry Dash</span>.</p>
 
        <h2>1. What data do we collect?</h2>
        <ul>
          <li><strong>Account:</strong> if you sign in with Google, we receive your email address and the basic profile data Google shares. We do not receive your password.</li>
          <li><strong>Content you create:</strong> your lists, demons, statistics, profile (name, country, avatar, banner), images you upload and preference settings (background color or image, and theme)</li>
          <li><strong>Technical data:</strong> when you use level autocomplete, our server receives the text searched and your IP address, only to respond and limit abuse.</li>
        </ul>
 
        <h2>2. Where is it stored?</h2>
        <ul>
          <li><strong>Without signing in:</strong> everything is stored only in your browser, in local storage.</li>
          <li><strong>Signed in:</strong> your data is stored in the cloud linked to your account, so you don't lose it and can see it by signing in on other devices. Your browser only keeps basic preferences and the session.</li>
        </ul>
 
        <h2>3. Third-party services</h2>
        <ul>
          <li>Google, for sign-in.</li>
          <li>Supabase, for authentication and database.</li>
          <li>GitHub Pages, to host the website, and Render, for the level autocomplete service.</li>
        </ul>
 
        <h2>4. What we don't do</h2>
        <p>We do not share your information with third parties except the providers needed for the application to work.</p>
 
        <h2>5. Your rights</h2>
        <p>You can export and delete your data at any time from Settings → Data.</p>
      `
    },
    terms: {
      title: 'Terms of Use | My Demon List',
      html: `
        <div style="display: flex; flex-direction: row; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line-1);">
          <div class="square">
            <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="80%" height="80%" fill="currentColor">
              <path d="M 19 6 L 14 1 L 5 1 C 3.9 1 3 1.9 3 3 L 3 21 C 3 22.1 3.9 23 5 23 L 19 23 C 20.1 23 21 22.1 21 21 L 21 8 L 19 6 Z M 13 3 L 18.5 8.5 L 13 8.5 L 13 3 Z M 19 21 L 5 21 L 5 3 L 11 3 L 11 10 L 19 10 L 19 21 Z" />
              <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="8" y1="16" x2="16" y2="16" />
              </g>
            </svg>
          </div>
          <h1>Terms of Use</h1>
        </div>
        <p class="updated" style="padding-top: 4px;">Last updated: October 23, 2026</p>
 
        <p>By using or registering on My Demon List, you agree to comply with these terms. If you do not agree with them, please do not use the application.</p>
 
        <h2>1. Independent project</h2>
        <p>My Demon List is a fan-made project with no affiliation with RobTop Games or Geometry Dash. All names, trademarks, logos and visual assets of the game belong to their respective owners.</p>
 
        <h2>2. Your account and your content</h2>
        <ul>
          <li>Although we do our best to keep your data safe, as an independent project we do not guarantee that the service will be uninterrupted or error-free, and we are not responsible for accidental loss of data or progress.</li>
          <li>You can explore the application anonymously or sign in with your Google account to sync and save your data in the cloud.</li>
        </ul>
 
        <h2>3. Acceptable use</h2>
        <ul>
          <li>Do not upload content that is illegal, offensive or that infringes third-party rights.</li>
          <li>Do not attempt to abuse or overload the application.</li>
        </ul>
 
        <h2>4. Availability</h2>
        <p>The service is provided "as is". It may change, be interrupted or be removed at any time. We recommend exporting a copy of your data from Settings.</p>
 
        <h2>5. Suspension</h2>
        <p>We may limit or delete accounts that violate these terms.</p>
 
        <h2>6. Changes</h2>
        <p>Continuing to use the application means accepting the current version. See also the <a href="privacy.html">privacy policy</a>.</p>
      `
    }
  },
 
  fr: {
    privacy: {
      title: 'Politique de confidentialité | My Demon List',
      html: `
        <div style="display: flex; flex-direction: row; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line-1);">
          <div class="square">
            <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
              <path d="M 12 4.22 C 9.43 4.22 7.34 6.31 7.34 8.88 L 7.34 11.23 L 8.98 11.23 L 8.98 8.88 C 8.98 7.21 10.33 5.86 12 5.86 C 13.67 5.86 15.02 7.21 15.02 8.88 L 15.02 11.23 L 16.66 11.23 L 16.66 8.88 C 16.66 6.31 14.57 4.22 12 4.22 Z" />
              <path d="M 7.68 10.37 L 16.32 10.37 C 17.12 10.37 17.76 11.01 17.76 11.81 L 17.76 18.34 C 17.76 19.14 17.12 19.78 16.32 19.78 L 7.68 19.78 C 6.88 19.78 6.24 19.14 6.24 18.34 L 6.24 11.81 C 6.24 11.01 6.88 10.37 7.68 10.37 Z M 12 12.62 C 11.39 12.62 10.9 13.12 10.9 13.73 C 10.9 14.21 11.21 14.62 11.62 14.77 L 11.62 17.04 C 11.62 17.25 11.79 17.42 12 17.42 C 12.21 17.42 12.38 17.25 12.38 17.04 L 12.38 14.77 C 12.79 14.62 13.1 14.21 13.1 13.73 C 13.1 13.12 12.61 12.62 12 12.62 Z" />
            </svg>
          </div>
          <h1>Politique de confidentialité</h1>
        </div>
        <p class="updated" style="padding-top: 4px;">Dernière mise à jour : 23 octobre 2026</p>
 
        <p>My Demon List est un projet indépendant créé pour organiser vos propres listes de niveaux demon et suivre votre progression dans <span style="font-weight: 600;">Geometry Dash</span>.</p>
 
        <h2>1. Quelles données collectons-nous ?</h2>
        <ul>
          <li><strong>Compte :</strong> si vous vous connectez avec Google, nous recevons votre adresse e-mail et les données de profil de base que Google partage. Nous ne recevons pas votre mot de passe.</li>
          <li><strong>Contenu que vous créez :</strong> vos listes, demons, statistiques, profil (nom, pays, avatar, bannière), images que vous téléversez et paramètres de préférence (couleur ou image de fond, et thème)</li>
          <li><strong>Données techniques :</strong> lorsque vous utilisez l'autocomplétion des niveaux, notre serveur reçoit le texte recherché et votre adresse IP, uniquement pour répondre et limiter les abus.</li>
        </ul>
 
        <h2>2. Où sont-elles stockées ?</h2>
        <ul>
          <li><strong>Sans connexion :</strong> tout est stocké uniquement dans votre navigateur, dans le stockage local.</li>
          <li><strong>Avec connexion :</strong> vos données sont stockées dans le cloud, associées à votre compte, pour que vous ne les perdiez pas et puissiez les retrouver en vous connectant sur d'autres appareils. Dans votre navigateur ne restent que des préférences de base et la session.</li>
        </ul>
 
        <h2>3. Services tiers</h2>
        <ul>
          <li>Google, pour la connexion.</li>
          <li>Supabase, pour l'authentification et la base de données.</li>
          <li>GitHub Pages, pour héberger le site, et Render, pour le service d'autocomplétion des niveaux.</li>
        </ul>
 
        <h2>4. Ce que nous ne faisons pas</h2>
        <p>Nous ne partageons pas vos informations avec des tiers, sauf les prestataires nécessaires au fonctionnement de l'application.</p>
 
        <h2>5. Vos droits</h2>
        <p>Vous pouvez exporter et supprimer vos données à tout moment depuis Paramètres → Données.</p>
      `
    },
    terms: {
      title: "Conditions d'utilisation | My Demon List",
      html: `
        <div style="display: flex; flex-direction: row; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line-1);">
          <div class="square">
            <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="80%" height="80%" fill="currentColor">
              <path d="M 19 6 L 14 1 L 5 1 C 3.9 1 3 1.9 3 3 L 3 21 C 3 22.1 3.9 23 5 23 L 19 23 C 20.1 23 21 22.1 21 21 L 21 8 L 19 6 Z M 13 3 L 18.5 8.5 L 13 8.5 L 13 3 Z M 19 21 L 5 21 L 5 3 L 11 3 L 11 10 L 19 10 L 19 21 Z" />
              <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="8" y1="16" x2="16" y2="16" />
              </g>
            </svg>
          </div>
          <h1>Conditions d'utilisation</h1>
        </div>
        <p class="updated" style="padding-top: 4px;">Dernière mise à jour : 23 octobre 2026</p>
 
        <p>En utilisant My Demon List ou en vous y inscrivant, vous acceptez de respecter ces conditions. Si vous n'êtes pas d'accord, veuillez ne pas utiliser l'application.</p>
 
        <h2>1. Projet indépendant</h2>
        <p>My Demon List est un projet de fans, sans lien avec RobTop Games ni avec Geometry Dash. Tous les noms, marques déposées, logos et ressources visuelles du jeu appartiennent à leurs propriétaires respectifs.</p>
 
        <h2>2. Votre compte et votre contenu</h2>
        <ul>
          <li>Bien que nous nous efforcions de protéger vos données, il s'agit d'un projet indépendant : nous ne garantissons pas que le service sera ininterrompu ou sans erreur, et nous ne sommes pas responsables de la perte accidentelle de données ou de progression.</li>
          <li>Vous pouvez explorer l'application de manière anonyme ou vous connecter avec votre compte Google pour synchroniser et enregistrer vos données dans le cloud.</li>
        </ul>
 
        <h2>3. Utilisation acceptable</h2>
        <ul>
          <li>Ne téléversez pas de contenu illégal, offensant ou portant atteinte aux droits de tiers.</li>
          <li>N'essayez pas d'abuser de l'application ni de la surcharger.</li>
        </ul>
 
        <h2>4. Disponibilité</h2>
        <p>Le service est fourni « tel quel ». Il peut changer, être interrompu ou supprimé à tout moment. Nous vous recommandons d'exporter une copie de vos données depuis les Paramètres.</p>
 
        <h2>5. Suspension</h2>
        <p>Nous pouvons limiter ou supprimer les comptes qui ne respectent pas ces conditions.</p>
 
        <h2>6. Modifications</h2>
        <p>Continuer à utiliser l'application implique d'accepter la version en vigueur. Consultez aussi la <a href="privacy.html">politique de confidentialité</a>.</p>
      `
    }
  }
};

function applyLegalLanguage() {
  const card = document.querySelector('.legal-card');
  const page = document.body.dataset.legal;
  if (!card || !page) return;

  if (!card.dataset.es) {
    card.dataset.es = card.innerHTML;
    card.dataset.esTitle = document.title;
  }

  const tr = LEGAL_I18N[appSettings.lang] && LEGAL_I18N[appSettings.lang][page];
  card.innerHTML = tr ? tr.html : card.dataset.es;
  document.title = tr ? tr.title : card.dataset.esTitle;
}