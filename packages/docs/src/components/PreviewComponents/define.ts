// Defines the web components only the landing-page preview renders. Loaded by PreviewComponents on the
// client (`import('./define')`), so the chunk is separate from the global bootstrap and tree-shaken to these six.
import {
  defineComponents,
  IgcAvatarComponent,
  IgcCalendarComponent,
  IgcCardComponent,
  IgcLinearProgressComponent,
  IgcListComponent,
  IgcTabsComponent,
} from 'igniteui-webcomponents';

defineComponents(
  IgcAvatarComponent,
  IgcCalendarComponent,
  IgcCardComponent,
  IgcLinearProgressComponent,
  IgcListComponent,
  IgcTabsComponent
);
