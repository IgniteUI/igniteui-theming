// The web components every page uses. Components that only the landing-page preview renders are defined
// by that island itself (src/components/PreviewComponents), so docs pages do not download them.
import {
  defineComponents,
  IgcButtonComponent,
  IgcIconButtonComponent,
  IgcIconComponent,
} from 'igniteui-webcomponents';

defineComponents(IgcButtonComponent, IgcIconComponent, IgcIconButtonComponent);
