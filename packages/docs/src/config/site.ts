// navbar and footer configuration,
// with the ja labels from `i18n/ja/theme/{navbar,footer}.json`.
import headerLogo from '../assets/header-logo.svg';
import headerLogoDark from '../assets/header-logo-dark.svg';
import infragisticsLogo from '../assets/infragistics-logo.svg';
import navbarJa from '../../i18n/ja/theme/navbar.json';
import footerJa from '../../i18n/ja/theme/footer.json';
import type { Locale } from '../lib/docs/config';

type Messages = Record<string, { message: string }>;
const NAVBAR_MESSAGES: Partial<Record<Locale, Messages>> = {
  ja: navbarJa as Messages,
};
const FOOTER_MESSAGES: Partial<Record<Locale, Messages>> = {
  ja: footerJa as Messages,
};

const t = (
  messages: Partial<Record<Locale, Messages>>,
  locale: Locale,
  key: string,
  fallback: string
) => messages[locale]?.[key]?.message ?? fallback;

export const SITE_TAGLINE = 'Ignite your design';
export const SOCIAL_CARD = 'img/igniteui-social-card.png';
export const FAVICON = 'img/favicon.ico';
export const GITHUB_URL = 'https://github.com/IgniteUI/igniteui-theming';

export const navbarLogo = {
  src: headerLogo,
  srcDark: headerLogoDark,
  alt: (locale: Locale) =>
    t(NAVBAR_MESSAGES, locale, 'logo.alt', 'IgniteUI logo'),
};

export const navbarLabels = {
  docs: (locale: Locale) =>
    t(NAVBAR_MESSAGES, locale, 'item.label.Docs', 'Docs'),
};

/** The GitHub navbar item's inline SVG, verbatim from `themeConfig.navbar.items`. */
export const GITHUB_ICON_SVG =
  '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.0012 10.0089C19.9974 14.2467 17.3229 18.0219 13.3262 19.4309V17.0819C13.2977 15.9386 12.7088 14.8823 11.7512 14.2569C15.0752 13.9069 16.6512 12.2569 16.6512 10.0069C16.6321 9.00164 16.24 8.03936 15.5512 7.30691C15.8012 6.53191 16.0762 4.90691 15.4762 4.30691C14.4668 4.32331 13.5122 4.76881 12.8512 5.53191C12.0704 5.26758 11.2516 5.13247 10.4272 5.13191C9.6027 5.13455 8.78394 5.2696 8.00223 5.53191C7.34061 4.7694 6.38564 4.32465 5.37623 4.30891C4.75123 4.93391 5.05123 6.53391 5.27623 7.30891C4.5841 8.04133 4.18393 9.00173 4.15123 10.0089C4.15123 12.2589 5.75123 13.9089 9.10123 14.3089C8.48386 14.6801 8.01501 15.2546 7.77523 15.9339C7.31148 15.9999 6.84366 16.0333 6.37523 16.0339C5.8404 16.1202 5.30931 15.8597 5.05023 15.3839C4.72683 14.9017 4.25226 14.5408 3.70123 14.3579C3.42623 14.3329 3.22623 14.5329 3.47623 14.7329C4.30123 15.3079 4.35123 16.2329 4.67623 16.8329C4.99871 17.3908 5.60788 17.7196 6.25123 17.6829H7.50123V19.3829C7.50123 19.4139 7.50123 19.5319 7.50123 19.6829C2.46849 18.3835 -0.72964 13.4451 0.143259 8.32109C1.01616 3.19711 5.669 -0.403817 10.8481 0.0363803C16.0273 0.476578 20.0056 4.81111 20.0012 10.0089Z" fill="var(--ig-secondary-400)"/></svg>';

export interface FooterLinkItem {
  label?: string;
  href?: string;
  html?: string;
  className?: string;
}
export interface FooterColumn {
  title: string;
  items: FooterLinkItem[];
}

const socialIcon = (
  href: string,
  label: string,
  svg: string
): FooterLinkItem => ({
  html: `<a class='footer-icon' href='${href}' aria-label='${label}'>${svg}</a>`,
});

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Products',
    items: [
      {
        label: 'Ignite UI',
        href: 'https://www.infragistics.com/products/ignite-ui',
      },
      { label: 'App Builder', href: 'https://appbuilder.dev/platform' },
      { label: 'Slingshot', href: 'https://www.slingshotapp.io' },
      { label: 'Reveal', href: 'https://www.revealbi.io' },
      {
        label: 'Pricing',
        href: 'https://www.infragistics.com/products#pricing',
      },
    ],
  },
  {
    title: 'Learn & Support',
    items: [
      {
        label: 'Help & API Docs',
        href: 'https://www.infragistics.com/support',
      },
      { label: 'Blogs', href: 'https://www.infragistics.com/blogs' },
      {
        label: 'Technical Support Chat',
        href: 'https://www.infragistics.com/support/chat',
      },
      {
        label: 'Forums',
        href: 'https://www.infragistics.com/community/forums',
      },
      {
        label: 'Product Ideas',
        href: 'https://www.infragistics.com/community/ideas',
      },
      {
        label: 'Submit a Request',
        href: 'https://account.infragistics.com/support-cases/submit',
      },
      { label: 'Service Health', href: 'https://www.infragistics.com/status' },
    ],
  },
  {
    title: 'My Account',
    items: [
      {
        label: 'Manage My Subscriptions',
        href: 'https://account.infragistics.com/subscriptions',
      },
      {
        label: 'Support Requests',
        href: 'https://account.infragistics.com/support-cases',
      },
    ],
  },
  {
    title: 'Compare',
    items: [
      {
        label: 'Angular Compare',
        href: 'https://www.infragistics.com/angular-compare',
      },
      {
        label: 'Blazor Compare',
        href: 'https://www.infragistics.com/blazor-compare',
      },
    ],
  },
  {
    title: 'Corporate',
    items: [
      { label: 'About us', href: 'https://www.infragistics.com/about-us' },
      {
        label: 'Careers',
        href: 'https://www.infragistics.com/about-us/careers',
      },
      { label: 'Legal', href: 'https://www.infragistics.com/legal/license' },
      {
        label: 'News & Events',
        href: 'https://www.infragistics.com/about-us/in-the-news',
      },
      {
        label: 'Partners',
        href: 'https://www.infragistics.com/about-us/alliances-partners',
      },
    ],
  },
  {
    title: 'Community',
    items: [
      socialIcon(
        'https://twitter.com/infragistics',
        'X (Twitter)',
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.0464 11.0812L17.1415 6H16.1711L12.6151 10.412L9.77551 6H6.5L10.7945 12.6717L6.5 18H7.47046L11.2254 13.3409L14.2245 18H17.5L13.046 11.0812H13.0464ZM11.7174 12.7302L11.2822 12.066L7.81997 6.77983H9.31038L12.1045 11.046L12.5397 11.7103L16.1717 17.2556H14.6813L11.7174 12.7305V12.7302Z"/></svg>'
      ),
      socialIcon(
        'https://discord.com/invite/c6e9Xdg3ty',
        'Discord',
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2067 7.00483C16.2358 6.53524 15.1974 6.19403 14.1119 6C13.9788 6.24899 13.8228 6.58394 13.7153 6.85063C12.5617 6.67136 11.4183 6.67136 10.2857 6.85063C10.1783 6.5843 10.0191 6.24899 9.8845 6C8.79794 6.1944 7.75849 6.53672 6.78757 7.00741C4.82897 10.0658 4.29818 13.0482 4.56375 15.9885C5.86271 16.9911 7.12168 17.5998 8.35924 17.9985C8.66479 17.564 8.9375 17.1018 9.17202 16.6149C8.72476 16.4393 8.29677 16.2227 7.89198 15.9712C7.99943 15.8889 8.10437 15.803 8.20575 15.7148C10.6741 16.9078 13.3555 16.9078 15.7942 15.7148C15.897 15.8033 16.002 15.8893 16.108 15.9712C15.7021 16.2238 15.2727 16.4407 14.8254 16.6163C15.0603 17.1021 15.3316 17.5651 15.6382 18C16.8772 17.6016 18.1369 16.9926 19.4362 15.9889C19.7478 12.5804 18.904 9.62534 17.2063 7.00556L17.2067 7.00483ZM9.50827 14.1803C8.76724 14.1803 8.1597 13.4654 8.1597 12.5952C8.1597 11.725 8.75438 11.0086 9.50827 11.0086C10.2622 11.0086 10.8697 11.7235 10.8568 12.5952C10.8579 13.4657 10.2622 14.1803 9.50827 14.1803ZM14.4917 14.1803C13.7507 14.1803 13.1431 13.4654 13.1431 12.5952C13.1431 11.725 13.7378 11.0086 14.4917 11.0086C15.2456 11.0086 15.8531 11.7235 15.8403 12.5952C15.8403 13.4657 15.2456 14.1803 14.4917 14.1803Z"/></svg>'
      ),
      socialIcon(
        'http://www.linkedin.com/company/infragistics',
        'LinkedIn',
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.55997 6C8.32837 6.0007 8.96215 6.65253 8.96044 7.44585C8.95872 8.27647 8.28761 8.90261 7.55072 8.88466C6.80321 8.90015 6.14614 8.25888 6.14648 7.44057C6.14614 6.6469 6.78231 5.9993 7.55997 6Z"/><path d="M8.37467 17.9985H6.72857C6.5148 17.9985 6.3418 17.8204 6.3418 17.6012V10.3856C6.3418 10.166 6.51514 9.98828 6.72857 9.98828H8.37467C8.58844 9.98828 8.76144 10.1664 8.76144 10.3856V17.6008C8.76144 17.8204 8.58809 17.9982 8.37467 17.9982V17.9985Z"/><path d="M17.853 12.5222C17.853 11.0094 16.6595 9.7832 15.1871 9.7832H14.7647C13.9593 9.7832 13.2474 10.1961 12.8195 10.8271C12.7729 10.8957 12.7297 10.9672 12.69 11.0411C12.6763 11.039 12.6681 11.0379 12.6681 11.0383V10.1528C12.6681 10.0616 12.5961 9.98769 12.5074 9.98769H10.4536C10.3649 9.98769 10.293 10.0616 10.293 10.1528V17.8329C10.293 17.924 10.3649 17.9979 10.4536 17.9979L12.5523 17.9986C12.641 17.9986 12.713 17.9247 12.713 17.8336V13.3964C12.713 12.6295 13.3084 11.9925 14.0548 11.984C14.4358 11.9794 14.7814 12.1364 15.0305 12.3923C15.2761 12.6446 15.4282 12.9934 15.4282 13.3785V17.8339C15.4282 17.9251 15.5002 17.999 15.5889 17.999L17.6927 17.9997C17.7814 17.9997 17.8534 17.9258 17.8534 17.8346V12.5222H17.853Z"/></svg>'
      ),
      socialIcon(
        'https://www.youtube.com/user/Infragistics?annotation_id=annotation_3135485231&feature=iv&src_vid=c8dSiyWIfEo&sub_confirmation=1',
        'YouTube',
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.6771 6H7.32293C5.48772 6 4 7.5768 4 9.52192V14.4781C4 16.4232 5.48772 18 7.32293 18H16.6771C18.5123 18 20 16.4232 20 14.4781V9.52192C20 7.5768 18.5123 6 16.6771 6ZM14.4297 12.2411L10.0545 14.453C9.93806 14.5119 9.80319 14.4219 9.80319 14.285V9.7234C9.80319 9.58443 9.94144 9.49444 10.0583 9.55736L14.4335 11.9074C14.5635 11.9771 14.5612 12.175 14.4297 12.2415V12.2411Z"/></svg>'
      ),
      socialIcon(
        'https://www.infragistics.com/blogs/',
        'Infragistics blogs',
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.4262 9.49381C12.2335 7.2406 9.31597 6 6.21094 6V8.34732C8.70568 8.34732 11.0495 9.34389 12.8108 11.1535C14.5721 12.9632 15.542 15.3714 15.542 17.9347H17.8266C17.8266 14.7444 16.6188 11.7467 14.4262 9.49381Z"/><path d="M6.1875 9.97168V12.319C9.20093 12.319 11.6527 14.8381 11.6527 17.9343H13.9373C13.9369 13.5436 10.4606 9.97168 6.1875 9.97168Z"/><path d="M7.80817 18.0002C8.71188 18.0002 9.44447 17.2475 9.44447 16.3189C9.44447 15.3904 8.71188 14.6377 7.80817 14.6377C6.90447 14.6377 6.17188 15.3904 6.17188 16.3189C6.17188 17.2475 6.90447 18.0002 7.80817 18.0002Z"/></svg>'
      ),
      socialIcon(
        'https://github.com/IgniteUI/igniteui-theming',
        'GitHub',
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_4001_8319)"><path fill-rule="evenodd" clip-rule="evenodd" d="M19 12.6191C18.9973 15.6333 17.1253 18.3185 14.3278 19.3208V17.65C14.3078 16.8367 13.8956 16.0855 13.2254 15.6406C15.552 15.3917 16.6551 14.2181 16.6551 12.6177C16.6417 11.9027 16.3673 11.2182 15.8852 10.6972C16.0602 10.146 16.2527 8.99017 15.8327 8.56341C15.1262 8.57507 14.4579 8.89195 13.9953 9.43472C13.4487 9.24671 12.8756 9.15061 12.2986 9.15021C11.7215 9.15208 11.1484 9.24814 10.6012 9.43472C10.1381 8.89237 9.46967 8.57602 8.76313 8.56483C8.32566 9.00938 8.53564 10.1474 8.69313 10.6987C8.20867 11.2196 7.92857 11.9027 7.90568 12.6191C7.90568 14.2195 9.02561 15.3931 11.3705 15.6776C10.9383 15.9416 10.6102 16.3503 10.4423 16.8334C10.1177 16.8804 9.79027 16.9041 9.46239 16.9046C9.08803 16.966 8.71629 16.7806 8.53494 16.4422C8.30857 16.0993 7.9764 15.8425 7.5907 15.7125C7.39822 15.6947 7.25822 15.8369 7.43321 15.9792C8.01068 16.3882 8.04568 17.0461 8.27316 17.4729C8.49888 17.8697 8.92527 18.1035 9.37559 18.0774H10.2505V19.2866C10.2505 19.3087 10.2505 19.3926 10.2505 19.5C6.72783 18.5757 4.48928 15.0632 5.10027 11.4186C5.71127 7.77403 8.96806 5.21277 12.5932 5.52588C16.2184 5.83898 19.0031 8.92203 19 12.6191Z"/></g><defs><clipPath id="clip0_4001_8319"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>'
      ),
    ],
  },
];

export const footerLogo = {
  src: infragisticsLogo,
  alt: 'Infragistics logo',
};

export function footerColumns(locale: Locale): FooterColumn[] {
  return FOOTER_COLUMNS.map((column) => ({
    title: t(
      FOOTER_MESSAGES,
      locale,
      `link.title.${column.title}`,
      column.title
    ),
    items: column.items.map((item) =>
      item.label
        ? {
            ...item,
            label: t(
              FOOTER_MESSAGES,
              locale,
              `link.item.label.${item.label}`,
              item.label
            ),
          }
        : item
    ),
  }));
}

export function footerCopyright(): string {
  return `Copyright © ${new Date().getFullYear()} INFRAGISTICS`;
}
