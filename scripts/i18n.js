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
  
  //generales ->
    'common.ok': 'OK', 'common.cancel': 'Cancel', 'common.save': 'Save', 'common.delete': 'Delete', 
    'common.noPhoto': 'No image',
    'dlg.alert': 'Notice', 'dlg.confirm': 'Confirm', 'o': 'or',
  
  //header ->
    'header.home': 'Home', 'header.settings': 'Settings', 'header.language': 'Language', 'header.login': 'Log in',
  
  //footer ->
    'footer.text': 'Create your own level lists and share them.', 'footer.reports': 'Reports', 'footer.copy': 'independent project · created by',
    'legal.privacy': 'Privacy policy', 'legal.terms': 'Terms of use',

//vista (SPA): main ----->

    'profile.edit': 'Edit profile', 'profile.id': 'ID: {id}',
    'stats.demons': 'Demons', 'stats.moons': 'Moons', 'stats.diamonds': 'Diamonds', 'stats.stars': 'Stars', 'stats.userCoins': 'User coins', 'stats.secretCoins': 'Secret coins', 'stats.edit': 'Click to edit', 'stats.value': 'Value:',

    'lists.title': 'My demon lists', 'lists.count': 'Total lists: {n}', 'lists.add': '+ Add', 'lists.filterFav': 'Filter favorites', 
    'lists.empty': 'Your panel is empty. Add your first list!', 'lists.emptyFav': 'You have no lists marked as favorite.',

    'list.edit': 'Edit list', 'list.view': 'View', 'list.by': 'By {name}',
    'list.info': 'Demons: {n} · Hardest: {hardest}',

    'welcome.text': 'Manage your progress, create your own Demon List of your hardest levels in Geometry Dash',
    'welcome.account': 'Log in', 'welcome.guest': 'Enter as guest', 'welcome.levels': 'Registered levels',

    'welcome.f1t': 'Autocomplete', 'welcome.f1d': 'Automatic level completion.',
    'welcome.f2t': 'List editor', 'welcome.f2d': 'Easily edit your demon list.',
    'welcome.f3t': 'Registry', 'welcome.f3d': 'Record the date and number of attempts for each level.',
    'welcome.f4t': 'Themes', 'welcome.f4d': 'Choose from multiple custom themes.',

//modales y pops de modal --->

  //modal-perfil ->
    'profile.editTitle': 'Edit profile',
    'profile.uploadImg': 'Upload image', 'profile.removeImg': 'Remove image', 'profile.uploadBanner': 'Upload banner', 'profile.removeBanner': 'Remove banner', 'profile.bannerColor': 'Change color',
    'profile.editBanner': 'Edit banner', 'profile.editAvatar': 'Edit picture', 'color.title': 'Pick a color', 'color.reset': 'Reset', 'color.apply': 'Apply',

    'profile.username': 'Username:', 'profile.name': 'your name', 'profile.country': 'Nationality:', 'profile.countryPh': 'Search your country...',
  
  //modal-iniciar sesion ->
    'login.title': 'Log in', 'auth.text': 'Sign in to save your lists in the cloud and use them on any device.',
    'auth.google': 'Continue with Google', 'auth.legal': 'By continuing, you accept our {terms} and {privacy}.',

    'acc.title': 'Account', 'acc.logged': 'Signed in as {email}', 'acc.signOut': 'Sign out',

    'auth.overwriteTitle': 'Existing account', 'auth.overwriteBack': 'Go back', 'auth.overwriteOk': 'Continue',
    'auth.overwriteText': 'This account already has saved data. If you continue, it will replace the data currently on this device. Do you wish to continue?', 'acc.error': 'Could not sync with the cloud. Check your connection.',

  //modal-vincular (en proceso) ->
    'sync.title': 'Link account', 'sync.submit': 'Link', 
    'sync.user': 'Geometry Dash username or ID:', 'sync.soon': 'Coming soon, with faith.',

    'sync.infoBtn': 'Information', 'sync.infoTitle': 'Link account', 'sync.infoText': 'We are still working on this feature. It will be available in upcoming versions :)',
    
  //modal-lista ->
    'listm.new': 'Create new list', 'listm.edit': 'Edit list', 'listm.create': 'Create list', 'listm.saveChanges': 'Save', 'listm.favTitle': 'Mark as favorite', 

    'listm.banner': 'List banner or image:', 'listm.upload': 'Upload banner', 'listm.remove': 'Remove banner', 'listm.name': 'List name:',

    'listm.import': 'Import list', 'listm.export': 'Export list', 
    'listm.invalidFile': 'This format is not supported.', 'listm.importErr': 'Error, the list could not be imported.', 'listm.importOk': 'List imported successfully.',
    'listm.replaceConfirm': 'This will replace the demons of this list with the ones in the file. Continue?', 'listm.deleteConfirm': 'Delete \"{title}\" and all its demons? This cannot be undone.',
    
  //modal-demon ->
    'demon.add': 'Add demon', 'demon.edit': 'Edit demon', 'demon.save': 'Save', 'demon.create': 'Add demon',

    'demon.thumbHint': 'Icon preview - thumbnail:', 'demon.name': 'Name:', 'demon.creator': 'Creator:', 'demon.difficulty': 'Difficulty:',
    'demon.levelId': 'ID:','demon.attempts': 'Attempts:', 'demon.winDate': 'Win date:', 'demon.position': 'Position:',

    'demon.yt': 'YouTube URL:',

//vista (SPA): Lista ----->

    'view.subtitle': 'Created by {name} · {n} demons', 
    'view.filters': 'Filters', 'view.difficulty': 'Difficulty', 'view.all': 'All', 'view.favFilter': 'Filter favorites', 'view.onlyFav': 'Favorites only',

    'view.search': 'Search level...', 'view.lock': 'Lock/unlock dragging', 'view.thumbYt': 'Show demon icons', 'view.sort': 'Sort by',

    'sort.custom': 'Custom order', 'sort.attempts_desc': 'Most attempts', 
    'sort.attempts_asc': 'Fewest attempts', 'sort.recent': 'Newest date', 'sort.oldest': 'Oldest date',

    'view.addDemon': '+ Demon', 'view.noMatch': 'No demon matches the filters', 'view.noMatchText': 'Change the search or the filters to see more results.',
    'view.empty': 'This list has no demons yet', 'view.emptyText': 'Press to add your first demon.',

    'card.publishedBy': 'published by {name}', 'card.attempts': 'Attempts:', 'card.date': 'Date:',
    'card.edit': 'Edit demon', 'card.addBelow': 'Add demon below', 'card.showcase': 'Watch showcase',

    'view.top': 'Back to top',

//vista (SPA): configuracion ----->

    'settings.title': 'Settings', 'settings.subtitle': 'Appearance and data', 
    
    'settings.theme': 'Theme', 'settings.themeHint' : 'Preset themes, solid colors and gradients.',

    'theme.blue': 'Blue', 'theme.white': 'White', 'theme.dark': 'Dark', 'theme.purple': 'Purple', 'theme.infernal': 'Infernal',
    'theme.atardecer': 'Sunset', 'theme.neon': 'Neon', 'theme.bosque': 'Forest', 'theme.rosa': 'Pastel pink',
    'theme.rosa-dark': 'Dark pink', 'theme.halloween': 'Halloween',
    
    'settings.data': 'Your account data', 
    'settings.dataHint':`All data is stored only in this browser. Clearing the cache or site data may erase everything. You can avoid this by exporting a backup first or by signing in.`,
    'settings.export': 'Export', 'settings.import': 'Import <small style="color: var(--mute); font-size: 11.5px; ">(overwrites everything)</small>', 

    'settings.invalidFile': 'The file is not valid.', 'settings.incompatible': 'The file does not match or is not compatible.',
    'settings.importConfirm': 'This will replace ALL your current data with the file contents. Continue?', 'settings.importTooBig': 'Import failed, the file is too large.',

    'settings.delHint': 'Delete all your account data. If you are not signed in, the data saved in this browser will be deleted.', 'settings.dataHintCloud': 'Your data is stored in your account. Export a backup before deleting or importing.', 
    'settings.deleteConfirm': 'ALL your data on this device will be deleted. There is no way to recover it. Continue?', 'settings.deleteConfirmCloud': 'ALL your account data will be deleted. There is no way to recover it. Continue?',
    'settings.deleteAll': 'Delete all data', 'settings.deletePrompt': 'Type DELETE to confirm', 'settings.deleteWord': 'DELETE',

    'storage.full': 'Changes could not be saved: the browser storage is full. Try smaller images.'
  },

  es: {
    'meta.title': 'My Demon List | Geometry Dash',
    'meta.desc': 'Crea y organiza tus listas personales de demons de Geometry Dash: tier, intentos, fecha de victoria, favoritos y tus estadísticas.',
  
  //generales ->
    'common.ok': 'Aceptar', 'common.cancel': 'Cancelar', 'common.save': 'Guardar', 'common.delete': 'Eliminar', 
    'common.noPhoto': 'Sin imagen',
    'dlg.alert': 'Aviso', 'dlg.confirm': 'Confirmar', 'o': 'o',
  
  //header ->
    'header.home': 'Inicio', 'header.settings': 'Ajustes', 'header.language': 'Idioma', 'header.login': 'Iniciar sesión',
  
  //footer ->
    'footer.text': 'Crea tus propias listas de niveles y compártelas.', 'footer.reports': 'Reportes', 'footer.copy': 'proyecto independiente · creado por',
    'legal.privacy': 'Política de privacidad', 'legal.terms': 'Términos de uso',

//vista (SPA): main ----->

    'profile.edit': 'Editar perfil', 'profile.id': 'ID: {id}',
    'stats.demons': 'Demons', 'stats.moons': 'Moons', 'stats.diamonds': 'Diamonds', 'stats.stars': 'Stars', 'stats.userCoins': 'User coins', 'stats.secretCoins': 'Secret coins', 'stats.edit': 'Clic para editar', 'stats.value': 'Valor:',

    'lists.title': 'Mis listas demon', 'lists.count': 'Listas totales: {n}', 'lists.add': '+ Añadir', 'lists.filterFav': 'Filtrar favoritos', 
    'lists.empty': 'Tu panel está vacío. ¡Agrega tu primera lista!', 'lists.emptyFav': 'No tienes listas marcadas como favoritas.',

    'list.edit': 'Editar lista', 'list.view': 'Ver', 'list.by': 'Por {name}',
    'list.info': 'Demons: {n} · Hardest: {hardest}',

    'welcome.text': 'Gestiona tu progreso, crea tu propia Demon list de tus niveles más difíciles en Geometry Dash',
    'welcome.account': 'Iniciar sesión', 'welcome.guest': 'Entrar sin cuenta', 'welcome.levels': 'Niveles registrados',

    'welcome.f1t': 'Autocompletado', 'welcome.f1d': 'Autocompletado de niveles automático.',
    'welcome.f2t': 'Editor de lista', 'welcome.f2d': 'Edita fácilmente tu lista de demons.',
    'welcome.f3t': 'Registro', 'welcome.f3d': 'Registra la fecha y el número de intentos de cada nivel.',
    'welcome.f4t': 'Temas', 'welcome.f4d': 'Elige entre varios temas personalizados.',

//modales y pops de modal --->

  //modal-perfil ->
    'profile.editTitle': 'Editar perfil',
    'profile.uploadImg': 'Subir imagen', 'profile.removeImg': 'Quitar imagen', 'profile.uploadBanner': 'Subir banner', 'profile.removeBanner': 'Quitar banner', 'profile.bannerColor': 'Cambiar color',
    'profile.editBanner': 'Editar banner', 'profile.editAvatar': 'Editar imagen', 'color.title': 'Elegir color', 'color.reset': 'Restablecer', 'color.apply': 'Aplicar',

    'profile.username': 'Nombre de usuario:', 'profile.name': 'tu nombre', 'profile.country': 'Nacionalidad:', 'profile.countryPh': 'Busca tu país...',
  
  //modal-iniciar sesion ->
    'login.title': 'Iniciar sesión', 'auth.text': 'Inicia sesión para guardar tus listas en la nube y usarlas en cualquier dispositivo.',
    'auth.google': 'Continuar con Google', 'auth.legal': 'Al continuar, aceptas nuestros {terms} y la {privacy}.',

    'acc.title': 'Cuenta', 'acc.logged': 'Sesión iniciada como {email}', 'acc.signOut': 'Cerrar sesión',

    'auth.overwriteTitle': 'Cuenta existente', 'auth.overwriteBack': 'Volver', 'auth.overwriteOk': 'Continuar',
    'auth.overwriteText': 'Esta cuenta ya tiene datos guardados. Si continúas, reemplazarán los datos que tienes ahora en este dispositivo. ¿Deseas continuar?', 'acc.error': 'No se pudo sincronizar con la nube. Revisa tu conexión.',

  //modal-vincular (en proceso) ->
    'sync.title': 'Vincular cuenta', 'sync.submit': 'Vincular', 
    'sync.user': 'Usuario o ID de Geometry Dash:', 'sync.soon': 'Próximamente, con fe.',

    'sync.infoBtn': 'Información', 'sync.infoTitle': 'Vincular cuenta', 'sync.infoText': 'Aún estamos trabajando en esta función. Estará disponible en próximas versiones :)',
    
  //modal-lista ->
    'listm.new': 'Crear nueva lista', 'listm.edit': 'Editar lista', 'listm.create': 'Crear lista', 'listm.saveChanges': 'Guardar', 'listm.favTitle': 'Marcar como favorito', 

    'listm.banner': 'Banner o imagen de lista:', 'listm.upload': 'Subir banner', 'listm.remove': 'Eliminar banner', 'listm.name': 'Nombre de lista:',

    'listm.import': 'Importar lista', 'listm.export': 'Exportar lista', 
    'listm.invalidFile': 'Este formato no es compatible.', 'listm.importErr': 'Error, no se pudo importar la lista.', 'listm.importOk': 'Lista importada con éxito.',
    'listm.replaceConfirm': 'Esto reemplazará los demons de esta lista por los del archivo. ¿Continuar?', 'listm.deleteConfirm': '¿Eliminar "{title}" y todos sus demons? No se podrán recuperar.',
    
  //modal-demon ->
    'demon.add': 'Agregar demon', 'demon.edit': 'Editar demon', 'demon.save': 'Guardar', 'demon.create': 'Agregar demon',

    'demon.thumbHint': 'Previsualización de icono - miniatura:', 'demon.name': 'Nombre:', 'demon.creator': 'Creador:', 'demon.difficulty': 'Dificultad:',
    'demon.levelId': 'ID:', 'demon.attempts': 'Intentos:', 'demon.winDate': 'Fecha de victoria:', 'demon.position': 'Posición:',

    'demon.yt': 'URL de YouTube:',

//vista (SPA): Lista ----->

    'view.subtitle': 'Creado por {name} · {n} demons', 
    'view.filters': 'Filtros', 'view.difficulty': 'Dificultad', 'view.all': 'Todas', 'view.favFilter': 'Filtrar favoritos', 'view.onlyFav': 'Solo favoritos',

    'view.search': 'Buscar nivel...', 'view.lock': 'Bloquear/desbloquear arrastre', 'view.thumbYt': 'Mostrar iconos Demon', 'view.sort': 'Ordenar por',

    'sort.custom': 'Orden personalizado', 'sort.attempts_desc': 'Más intentos', 
    'sort.attempts_asc': 'Menos intentos', 'sort.recent': 'Fecha más reciente', 'sort.oldest': 'Fecha más antigua',

    'view.addDemon': '+ Demon', 'view.noMatch': 'Ningún demon coincide con los filtros', 'view.noMatchText': 'Cambia la búsqueda o filtros para ver más resultados.',
    'view.empty': 'Esta lista aún no tiene demons', 'view.emptyText': 'Pulsa para añadir tu primer demon.',

    'card.publishedBy': 'publicado por {name}', 'card.attempts': 'Intentos:', 'card.date': 'Fecha:',
    'card.edit': 'Editar demon', 'card.addBelow': 'Agregar demon debajo', 'card.showcase': 'Ver showcase',

    'view.top': 'Volver arriba',

//vista (SPA): configuracion ----->

    'settings.title': 'Ajustes', 'settings.subtitle': 'Apariencia y datos', 
    
    'settings.theme': 'Tema', 'settings.themeHint' : 'Temas preestablecidos, colores sólidos y gradientes.',

    'theme.blue': 'Azul', 'theme.white': 'Blanco', 'theme.dark': 'Oscuro', 'theme.purple': 'Púrpura', 'theme.infernal': 'Infernal',
    'theme.atardecer': 'Atardecer', 'theme.neon': 'Neón', 'theme.bosque': 'Bosque', 'theme.rosa': 'Rosa pastel',
    'theme.rosa-dark': 'Rosa oscuro', 'theme.halloween': 'Halloween',
    
    'settings.data': 'Datos de tu cuenta', 
    'settings.dataHint':`Todos los datos se guardan únicamente en este navegador, al borrar el caché o datos del sistema es posible que toda la información se pierda. Puedes evitar esto exportando una copia de seguridad antes o iniciando sesión.`,
    'settings.export': 'Exportar', 'settings.import': 'Importar <small style="color: var(--mute); font-size: 11.5px; ">(sobreescribe todo)</small>', 

    'settings.invalidFile': 'El archivo no es válido.', 'settings.incompatible': 'El archivo no coincide o no es compatible.',
    'settings.importConfirm': 'Esto reemplazará TODOS tus datos actuales por los del archivo. ¿Continuar?', 'settings.importTooBig': 'Error al importar, archivo demasiado grande.',

    'settings.delHint': 'Borrar todos los datos de tu cuenta. Si no has iniciado sesión, se borrarán los datos guardados en este navegador.', 'settings.dataHintCloud': 'Tus datos se guardan en tu cuenta. Exporta una copia de seguridad antes de borrar o importar.', 
    'settings.deleteConfirm': 'Se borrarán TODOS tus datos en este dispositivo. No hay manera de recuperarlos. ¿Continuar?', 'settings.deleteConfirmCloud': 'Se borrarán TODOS los datos de tu cuenta, no hay manera de recuperarlos. ¿Continuar?',
    'settings.deleteAll': 'Borrar todos los datos', 'settings.deletePrompt': 'Escribe BORRAR para confirmar', 'settings.deleteWord': 'BORRAR',

    'storage.full': 'No se pudieron guardar los cambios: el almacenamiento del navegador está lleno. Prueba con imágenes más ligeras.'
  },

  fr: {
    'meta.title': 'My Demon List | Geometry Dash',
    'meta.desc': 'Créez et organisez vos listes personnelles de demons Geometry Dash : tier, essais, date de victoire, favoris et vos statistiques.',
  
  //generales ->
    'common.ok': 'Ok', 'common.cancel': 'Annuler', 'common.save': 'Enregistrer', 'common.delete': 'Supprimer', 
    'common.noPhoto': 'Sans image',
    'dlg.alert': 'Avis', 'dlg.confirm': 'Confirmer', 'o': 'ou',
  
  //header ->
    'header.home': 'Accueil', 'header.settings': 'Paramètres', 'header.language': 'Langue', 'header.login': 'Se connecter',
  
  //footer ->
    'footer.text': 'Créez vos propres listes de niveaux et partagez-les.', 'footer.reports': 'Signalements', 'footer.copy': 'projet indépendant · créé par',
    'legal.privacy': 'Politique de confidentialité', 'legal.terms': 'Conditions d\'utilisation',

//vista (SPA): main ----->

    'profile.edit': 'Modifier le profil', 'profile.id': 'ID : {id}',
    'stats.demons': 'Demons', 'stats.moons': 'Moons', 'stats.diamonds': 'Diamonds', 'stats.stars': 'Stars', 'stats.userCoins': 'User coins', 'stats.secretCoins': 'Secret coins', 'stats.edit': 'Cliquer pour modifier', 'stats.value': 'Valeur :',

    'lists.title': 'Mes listes demon', 'lists.count': 'Listes totales : {n}', 'lists.add': '+ Ajouter', 'lists.filterFav': 'Filtrer les favoris', 
    'lists.empty': 'Votre panneau est vide. Ajoutez votre première liste !', 'lists.emptyFav': 'Vous n\'avez aucune liste marquée comme favorite.',

    'list.edit': 'Modifier la liste', 'list.view': 'Voir', 'list.by': 'Par {name}',
    'list.info': 'Demons : {n} · Hardest : {hardest}',

    'welcome.text': 'Gérez votre progression, créez votre propre Demon List de vos niveaux les plus difficiles sur Geometry Dash',
    'welcome.account': 'Se connecter', 'welcome.guest': 'Entrer sans compte', 'welcome.levels': 'Niveaux enregistrés',

    'welcome.f1t': 'Saisie automatique', 'welcome.f1d': 'Auto-complétion automatique des niveaux.',
    'welcome.f2t': 'Éditeur de liste', 'welcome.f2d': 'Modifiez facilement votre demon list.',
    'welcome.f3t': 'Enregistrement', 'welcome.f3d': 'Enregistrez la date et le nombre de tentatives pour chaque niveau.',
    'welcome.f4t': 'Thèmes', 'welcome.f4d': 'Choisissez parmi plusieurs thèmes personnalisés.',

//modales y pops de modal --->

  //modal-perfil ->
    'profile.editTitle': 'Modifier le profil',
    'profile.uploadImg': 'Téléverser une image', 'profile.removeImg': 'Supprimer l\'image', 'profile.uploadBanner': 'Téléverser une bannière', 'profile.removeBanner': 'Supprimer la bannière', 'profile.bannerColor': 'Changer de couleur',
    'profile.editBanner': 'Modifier la bannière', 'profile.editAvatar': 'Modifier l\'image', 'color.title': 'Choisir une couleur', 'color.reset': 'Réinitialiser', 'color.apply': 'Appliquer',

    'profile.username': 'Nom d\'utilisateur :', 'profile.name': 'votre nom', 'profile.country': 'Nationalité :', 'profile.countryPh': 'Recherchez votre pays...',
  
  //modal-iniciar sesion ->
    'login.title': 'Se connecter', 'auth.text': 'Connectez-vous pour enregistrer vos listes dans le cloud et les utiliser sur tout appareil.',
    'auth.google': 'Continuer avec Google', 'auth.legal': 'En continuant, vous acceptez nos {terms} et la {privacy}.',

    'acc.title': 'Compte', 'acc.logged': 'Connecté en tant que {email}', 'acc.signOut': 'Se déconnecter',

    'auth.overwriteTitle': 'Compte existant', 'auth.overwriteBack': 'Revenir', 'auth.overwriteOk': 'Continuer',
    'auth.overwriteText': 'Ce compte contient déjà des données. Si vous continuez, elles remplaceront les données actuellement présentes sur cet appareil. Souhaitez-vous continuer ?', 'acc.error': 'Synchronisation impossible. Vérifiez votre connexion.',

  //modal-vincular (en proceso) ->
    'sync.title': 'Lier un compte', 'sync.submit': 'Lier', 
    'sync.user': 'Nom d\'utilisateur ou ID Geometry Dash :', 'sync.soon': 'Bientôt disponible, avec foi.',

    'sync.infoBtn': 'Informations', 'sync.infoTitle': 'Lier un compte', 'sync.infoText': 'Nous travaillons encore sur cette fonctionnalité. Elle sera disponible dans les prochaines versions :)',
    
  //modal-lista ->
    'listm.new': 'Créer une nouvelle liste', 'listm.edit': 'Modifier la liste', 'listm.create': 'Créer la liste', 'listm.saveChanges': 'Enregistrer', 'listm.favTitle': 'Marquer comme favorite', 

    'listm.banner': 'Bannière ou image de la liste :', 'listm.upload': 'Téléverser une bannière', 'listm.remove': 'Supprimer la bannière', 'listm.name': 'Nom de la liste :',

    'listm.import': 'Importer une liste', 'listm.export': 'Exporter la liste', 
    'listm.invalidFile': 'Ce format n\'est pas pris en charge.', 'listm.importErr': 'Erreur : impossible d\'importer la liste.', 'listm.importOk': 'Liste importée avec succès.',
    'listm.replaceConfirm': 'Cela remplacera les demons de cette liste par ceux du fichier. Continuer ?', 'listm.deleteConfirm': 'Supprimer \"{title}\" et tous ses demons ? Impossible de les récupérer.',
    
  //modal-demon ->
    'demon.add': 'Ajouter un demon', 'demon.edit': 'Modifier le demon', 'demon.save': 'Enregistrer', 'demon.create': 'Ajouter un demon',

    'demon.thumbHint': 'Aperçu de l\'icône - miniature :', 'demon.name': 'Nom :', 'demon.creator': 'Créateur :', 'demon.difficulty': 'Difficulté :',
    'demon.levelId': 'ID :', 'demon.attempts': 'Essais :', 'demon.winDate': 'Date de victoire :', 'demon.position': 'Position :',

    'demon.yt': 'URL YouTube :',

//vista (SPA): Lista ----->

    'view.subtitle': 'Créée par {name} · {n} demons', 
    'view.filters': 'Filtres', 'view.difficulty': 'Difficulté', 'view.all': 'Toutes', 'view.favFilter': 'Filtrer les favoris', 'view.onlyFav': 'Uniquement les favoris',

    'view.search': 'Rechercher un niveau...', 'view.lock': 'Verrouiller/déverrouiller le glissement', 'view.thumbYt': 'Afficher les icônes demon', 'view.sort': 'Trier par',

    'sort.custom': 'Ordre personnalisé', 'sort.attempts_desc': 'Plus d\'essais', 
    'sort.attempts_asc': 'Moins d\'essais', 'sort.recent': 'Date la plus récente', 'sort.oldest': 'Date la plus ancienne',

    'view.addDemon': '+ Demon', 'view.noMatch': 'Aucun demon ne correspond aux filtres', 'view.noMatchText': 'Modifiez la recherche ou les filtres pour voir plus de résultats.',
    'view.empty': 'Cette liste ne contient pas encore de demons', 'view.emptyText': 'Appuyez pour ajouter votre premier demon.',

    'card.publishedBy': 'publié par {name}', 'card.attempts': 'Essais :', 'card.date': 'Date :',
    'card.edit': 'Modifier le demon', 'card.addBelow': 'Ajouter un demon ci-dessous', 'card.showcase': 'Voir le showcase',

    'view.top': 'Retour en haut',

//vista (SPA): configuracion ----->

    'settings.title': 'Paramètres', 'settings.subtitle': 'Apparence et données', 
    
    'settings.theme': 'Thème', 'settings.themeHint' : 'Thèmes prédéfinis, couleurs unies et dégradés.',

    'theme.blue': 'Bleu', 'theme.white': 'Blanc', 'theme.dark': 'Sombre', 'theme.purple': 'Violet', 'theme.infernal': 'Infernal',
    'theme.atardecer': 'Coucher de soleil', 'theme.neon': 'Néon', 'theme.bosque': 'Forêt', 'theme.rosa': 'Rose pastel',
    'theme.rosa-dark': 'Rose sombre', 'theme.halloween': 'Halloween',
    
    'settings.data': 'Données de votre compte', 
    'settings.dataHint':`Toutes les données sont enregistrées uniquement dans ce navigateur ; vider le cache ou les données du site peut tout effacer. Vous pouvez l'éviter en exportant d'abord une sauvegarde ou en vous connectant.`,
    'settings.export': 'Exporter', 'settings.import': 'Importer <small style="color: var(--mute); font-size: 11.5px; ">(écrase tout)</small>', 

    'settings.invalidFile': 'Le fichier n\'est pas valide.', 'settings.incompatible': 'Le fichier ne correspond pas ou n\'est pas compatible.',
    'settings.importConfirm': 'Cela remplacera TOUTES vos données actuelles par le contenu du fichier. Continuer ?', 'settings.importTooBig': 'Échec de l\'importation, le fichier est trop volumineux.',

    'settings.delHint': 'Supprimer toutes les données de votre compte. Si vous n\'êtes pas connecté, les données enregistrées dans ce navigateur seront supprimées.', 'settings.dataHintCloud': 'Vos données sont enregistrées dans votre compte. Exportez une sauvegarde avant toute suppression ou importation.', 
    'settings.deleteConfirm': 'TOUTES vos données sur cet appareil seront supprimées. Impossible de les récupérer. Continuer ?', 'settings.deleteConfirmCloud': 'TOUTES les données de votre compte seront supprimées. Impossible de les récupérer. Continuer ?',
    'settings.deleteAll': 'Supprimer toutes les données', 'settings.deletePrompt': 'Tapez SUPPRIMER pour confirmer', 'settings.deleteWord': 'SUPPRIMER',

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

  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });

  applyLegalLanguage();   // no-op fuera de privacy.html / terms.html
}

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
                <p class="updated" style="padding-top: 4px;">Last updated: October 24, 2026</p>

        <p>My Demon List is an independent project created to organize your own lists of demon levels and keep track of your progress in <strong>Geometry Dash</strong>.</p>

        <h2>1. What data is collected?</h2>
        <ul>
          <li><strong>Account:</strong> if you sign in with Google, we receive your email address and the basic profile data Google provides. We do not receive your password.</li>
          <li><strong>Content you create:</strong> your lists, demons, statistics and profile. We also receive any images you upload and your preference settings (theme).</li>
          <li><strong>Technical data:</strong> when you use level autocomplete, the server receives the search text and your IP address in order to provide a response and limit abuse.</li>
        </ul>

        <h2>2. Where is it stored?</h2>
        <ul>
          <li><strong>Without signing in:</strong> everything is stored only in your browser, in local storage.</li>
          <li><strong>Signed in:</strong> your data is stored in the cloud. Images you upload are kept in public storage: anyone with the direct link can view them. Your browser only keeps basic preferences and the session.</li>
        </ul>

        <h2>3. Third-party services</h2>
        <p>To work, the application uses the following services. Some of them receive your IP address when your browser loads or queries their resources:</p>
        <ul>
          <li><strong>Google:</strong> sign-in and YouTube video thumbnails.</li>
          <li><strong>Supabase:</strong> authentication, database and image storage.</li>
          <li><strong>GitHub Pages:</strong> website hosting.</li>
          <li><strong>Render:</strong> level autocomplete service; it receives the text searched and your IP.</li>
        </ul>
        <p>Level data comes from GD Ladder (gdladder.com), adapted for this project.</p>

        <h2>4. What we don't do</h2>
        <p>We do not sell your data or use analytics. We use your browser's local storage to keep your session and preferences; we do not use tracking cookies. We do not share your information with third parties, except the providers needed for the app to work (section 3).</p>

        <h2>5. Your rights</h2>
        <p>You can export and delete your data at any time from <b>Settings</b>. To delete your account and your email, contact us through the report form.</p>

        <h2>6. Changes and contact</h2>
        <p>We may update this policy; the date above shows the latest version. For questions or requests, use the report form.</p>
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
                <p class="updated" style="padding-top: 4px;">Last updated: October 24, 2026</p>

        <p>By using or registering on My Demon List, you agree to comply with these terms. If you do not agree with them, please do not use the application.</p>

        <h2>1. Independent project</h2>
        <p>My Demon List is a fan-made project with no affiliation with RobTop Games or Geometry Dash. All names, trademarks, logos and visual assets of the game belong to their respective owners.</p>

        <h2>2. Your account and your content</h2>
        <ul>
          <li>You can use the application anonymously or sign in with Google to sync your data in the cloud.</li>
          <li>You are responsible for what you upload. You keep all rights to your content.</li>
          <li>Your personal data is handled according to the <a href="privacy.html">privacy policy</a>.</li>
        </ul>

        <h2>3. Acceptable use</h2>
        <ul>
          <li>Do not upload content that is illegal, offensive or that infringes third-party rights.</li>
          <li>Do not attempt to abuse or overload the server.</li>
        </ul>

        <h2>4. Availability and liability</h2>
        <p>The service is provided "as is". As an independent project, it is not guaranteed to be uninterrupted or error-free. We are not responsible for accidental loss of data or progress. We recommend exporting a backup copy from <b>Settings</b>.</p>

        <h2>5. Suspension</h2>
        <p>We may limit or delete accounts that violate these terms.</p>

        <h2>6. Changes</h2>
        <p>We may update these terms; continuing to use the application means accepting the current version.</p>
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
                <p class="updated" style="padding-top: 4px;">Dernière mise à jour : 24 octobre 2026</p>

        <p>My Demon List est un projet indépendant créé pour organiser vos propres listes de niveaux demon et suivre votre progression dans <strong>Geometry Dash</strong>.</p>

        <h2>1. Quelles données sont collectées ?</h2>
        <ul>
          <li><strong>Compte :</strong> si vous vous connectez avec Google, nous recevons votre adresse e-mail et les données de profil de base fournies par Google. Nous ne recevons pas votre mot de passe.</li>
          <li><strong>Contenu que vous créez :</strong> vos listes, demons, statistiques et profil. Nous recevons aussi les images que vous téléversez et vos paramètres de préférence (thème).</li>
          <li><strong>Données techniques :</strong> lorsque vous utilisez l'autocomplétion des niveaux, le serveur reçoit le texte recherché ainsi que votre adresse IP, afin de fournir une réponse et de limiter les abus.</li>
        </ul>

        <h2>2. Où sont-elles stockées ?</h2>
        <ul>
          <li><strong>Sans connexion :</strong> tout est stocké uniquement dans votre navigateur, dans le stockage local.</li>
          <li><strong>Avec connexion :</strong> vos données sont stockées dans le cloud. Les images que vous téléversez sont conservées dans un stockage public : toute personne disposant du lien direct peut les voir. Dans votre navigateur ne restent que les préférences de base et la session.</li>
        </ul>

        <h2>3. Services tiers</h2>
        <p>Pour fonctionner, l'application utilise les services suivants. Certains reçoivent votre adresse IP lorsque votre navigateur charge ou interroge leurs ressources :</p>
        <ul>
          <li><strong>Google :</strong> connexion et miniatures des vidéos YouTube.</li>
          <li><strong>Supabase :</strong> authentification, base de données et stockage des images.</li>
          <li><strong>GitHub Pages :</strong> hébergement du site.</li>
          <li><strong>Render :</strong> service d'autocomplétion des niveaux ; il reçoit le texte recherché et votre IP.</li>
        </ul>
        <p>Les données des niveaux proviennent de GD Ladder (gdladder.com), adaptées pour ce projet.</p>

        <h2>4. Ce que nous ne faisons pas</h2>
        <p>Nous ne vendons pas vos données et n'utilisons pas d'outils d'analyse. Nous utilisons le stockage local de votre navigateur pour conserver votre session et vos préférences ; nous n'utilisons pas de cookies de suivi. Nous ne partageons pas vos informations avec des tiers, sauf les prestataires nécessaires au fonctionnement de l'application (section 3).</p>

        <h2>5. Vos droits</h2>
        <p>Vous pouvez exporter et supprimer vos données à tout moment depuis les <b>Paramètres</b>. Pour supprimer votre compte et votre e-mail, contactez-nous via le formulaire de signalement.</p>

        <h2>6. Modifications et contact</h2>
        <p>Nous pouvons mettre à jour cette politique ; la date ci-dessus indique la dernière version. Pour toute question ou demande, utilisez le formulaire de signalement.</p>
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
                <p class="updated" style="padding-top: 4px;">Dernière mise à jour : 24 octobre 2026</p>

        <p>En utilisant My Demon List ou en vous y inscrivant, vous acceptez de respecter ces conditions. Si vous n'êtes pas d'accord, veuillez ne pas utiliser l'application.</p>

        <h2>1. Projet indépendant</h2>
        <p>My Demon List est un projet de fans, sans lien avec RobTop Games ni avec Geometry Dash. Tous les noms, marques déposées, logos et ressources visuelles du jeu appartiennent à leurs propriétaires respectifs.</p>

        <h2>2. Votre compte et votre contenu</h2>
        <ul>
          <li>Vous pouvez utiliser l'application de manière anonyme ou vous connecter avec Google pour synchroniser vos données dans le cloud.</li>
          <li>Vous êtes responsable de ce que vous téléversez. Vous conservez tous les droits sur votre contenu.</li>
          <li>Vos données personnelles sont traitées conformément à la <a href="privacy.html">politique de confidentialité</a>.</li>
        </ul>

        <h2>3. Utilisation acceptable</h2>
        <ul>
          <li>Ne téléversez pas de contenu illégal, offensant ou portant atteinte aux droits de tiers.</li>
          <li>N'essayez pas d'abuser du serveur ni de le surcharger.</li>
        </ul>

        <h2>4. Disponibilité et responsabilité</h2>
        <p>Le service est fourni « tel quel ». Étant un projet indépendant, il n’est pas garanti qu’il soit ininterrompu ou exempt d’erreurs. Nous ne sommes pas responsables de la perte accidentelle de données ou de progression. Nous vous recommandons d'exporter une copie de sauvegarde depuis les <b>Paramètres</b>.</p>

        <h2>5. Suspension</h2>
        <p>Nous pouvons limiter ou supprimer les comptes qui ne respectent pas ces conditions.</p>

        <h2>6. Modifications</h2>
        <p>Nous pouvons mettre à jour ces conditions ; continuer à utiliser l'application implique d'accepter la version en vigueur.</p>
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


// ------------------------------------------------------
// constantes extra (cache)
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

const svg = {
  Info: `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>`,
  Options: `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="5" r="2" fill="currentColor"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <circle cx="12" cy="19" r="2" fill="currentColor"/>
  </svg>`,
  Pencil: `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>`,
  Pin: `
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>
  </svg>`,
  Filter: `
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line>
    <line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line>
    <line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line>
    <line x1="17" y1="16" x2="23" y2="16"></line>
  </svg>`,
  Search: `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="10" cy="10" r="6"></circle><line x1="21" y1="21" x2="15" y2="15"></line>
  </svg>`,
  Yt: `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.58 7.19C21.35 6.33 20.67 5.65 19.81 5.42C18.25 5 12 5 12 5C12 5 5.75 5 4.19 5.42C3.33 5.65 2.65 6.33 2.42 7.19C2 8.75 2 12 2 12C2 12 2 15.25 2.42 16.81C2.65 17.67 3.33 18.35 4.19 18.58C5.75 19 12 19 12 19C12 19 18.25 19 19.81 18.58C20.67 18.35 21.35 17.67 21.58 16.81C22 15.25 22 12 22 12C22 12 22 8.75 21.58 7.19ZM10 15V9L15.2 12L10 15Z"/>
  </svg>`,
  Configuration: `
  <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
    <circle cx="12" cy="12" r="2" />
  </svg>`,
  Home: `
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>`,
  Lang: `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04M18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12m-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
  </svg>`,
  Globe: `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.9 17.39c-.26-.8-1.01-1.39-1.9-1.39h-1v-3a1 1 0 0 0-1-1H8v-2h2a1 1 0 0 0 1-1V7h2a2 2 0 0 0 2-2v-.41a7.984 7.984 0 0 1 2.9 12.8M11 19.93c-3.95-.49-7-3.85-7-7.93c0-.62.08-1.22.21-1.79L9 15v1a2 2 0 0 0 2 2m1-16A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2"/>
  </svg>`,
  Perfil: `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2A5 5 0 1 0 12 12A5 5 0 0 0 12 2ZM4 19C4 15.686 7.582 13 12 13C16.418 13 20 15.686 20 19C20 20.105 19.105 21 18 21H6C4.895 21 4 20.105 4 19Z" />
  </svg>`,
  Wave: `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" class="icon-chevron">
    <path d="M 7.41 8.59 L 12 13.17 L 16.59 8.59 L 18 10 L 12 16 L 6 10 L 7.41 8.59 Z" fill="currentColor" />
  </svg>`,
  List: `
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <line x1="9" y1="6" x2="21" y2="6"></line><line x1="9" y1="12" x2="21" y2="12"></line><line x1="9" y1="18" x2="21" y2="18"></line>
    <circle cx="4" cy="6" r="1" fill="currentColor"></circle><circle cx="4" cy="12" r="1" fill="currentColor"></circle><circle cx="4" cy="18" r="1" fill="currentColor"></circle>
  </svg>`,
  Drag: `
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="9" cy="12" r="1.8"/>
    <circle cx="15" cy="12" r="1.8"/><circle cx="9" cy="18" r="1.8"/><circle cx="15" cy="18" r="1.8"/>
  </svg>`,
  Palette: `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.7 0 3-1.3 3-3 0-.8-.3-1.5-.8-2-.5-.6-.8-1.2-.8-2 0-1.7 1.3-3 3-3h2.5c1.9 0 3.5-1.6 3.5-3.5C22 5.5 17.5 2 12 2z"/>
    <circle cx="7" cy="10" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="11" cy="7" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="8" r="1.4" fill="currentColor" stroke="none"/>
  </svg>`,
  AREDL: `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 4v16h16"/>
    <polyline points="7 16 10 12 13 14 19 8"/>
  </svg>`
}