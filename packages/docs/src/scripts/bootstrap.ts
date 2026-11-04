// One client module that registers the Ignite UI web components and icons for every page.
import '../utils/registerComponents';
import { registerIcons } from '../icons/registerIcons';

registerIcons();
document.documentElement.dataset.iconsReady = '';
