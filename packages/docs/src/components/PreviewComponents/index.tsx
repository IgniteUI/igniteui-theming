import React, { useEffect, useState } from 'react';
import type { IgcTabsComponent } from 'igniteui-webcomponents';
import useBaseUrl from '@/lib/site/useBaseUrl';
import Translate, { LocaleProvider, translator } from '@/lib/i18n/Translate';
import type { Locale } from '@/lib/docs/config';
import './preview-components.scss';

const date = new Date();
date.setDate(date.getDate() - 2);

function PreviewSkeleton() {
  return (
    <div className="preview preview--skeleton" aria-hidden="true" inert>
      <div className="preview__list skeleton-box"></div>
      <div className="preview__card--horizontal skeleton-box"></div>
      <div className="preview__calendar skeleton-box"></div>
      <div className="preview__tabs skeleton-box"></div>
      <div className="preview__card--vertical skeleton-box"></div>
    </div>
  );
}

export default function PreviewComponents({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // The preview is the only place these components appear, so they are defined here (client side, in their
  // own chunk) instead of in the global bootstrap that every docs page loads.
  useEffect(() => {
    void import('./define');
  }, []);

  // Get all image URLs
  const listFirst = useBaseUrl('/img/components/list_first.webp', { asset: true });
  const listSecond = useBaseUrl('/img/components/list_second.webp', { asset: true });
  const listThird = useBaseUrl('/img/components/list_third.webp', { asset: true });
  const musicCard = useBaseUrl('/img/components/music_card_image.webp', { asset: true });
  const cardImage = useBaseUrl('/img/components/card_image.webp', { asset: true });

  // Preload all images before showing components
  useEffect(() => {
    const imagesToLoad = [
      listFirst,
      listSecond,
      listThird,
      musicCard,
      cardImage,
    ];

    Promise.all(
      imagesToLoad.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = src;
          })
      )
    ).then(() => setImagesLoaded(true));
  }, [listFirst, listSecond, listThird, musicCard, cardImage]);

  useEffect(() => {
    if (!imagesLoaded) return;

    const cal = document.getElementById('calendar1') as any;
    if (cal) {
      cal.value = date;
    }
  }, [imagesLoaded]);

  useEffect(() => {
    if (!imagesLoaded) return;

    const tabs = document.querySelector('igc-tabs') as IgcTabsComponent;
    if (tabs?.shadowRoot) {
      const span = tabs.shadowRoot.querySelector(
        '[part="selected-indicator"] span'
      ) as HTMLSpanElement;
      if (span) {
        span.style.height = '.125rem';
        span.style.background = 'var(--indicator-color)';
      }
    }
  }, [imagesLoaded]);

  if (!imagesLoaded) {
    return (
      <LocaleProvider locale={locale}>
        <PreviewSkeleton />
      </LocaleProvider>
    );
  }

  return (
    <LocaleProvider locale={locale}>
      {/* Decorative showcase: hidden from assistive technology and out of the tab order. */}
      <div className="preview preview--loaded" aria-hidden="true" inert>
      <div className="preview__list it-hover-border">
        <igc-list>
          <igc-list-item>
            <igc-avatar slot="start" src={listFirst}></igc-avatar>
            <h4 slot="title">Young And Beautiful</h4>
            <span slot="subtitle">Lana Del Rey</span>
            <span slot="end">4.32</span>
            <igc-icon-button
              slot="end"
              name="pause"
              aria-label={t({
                id: 'previewComponents.actions.pause',
                message: 'Pause',
              })}
            ></igc-icon-button>
          </igc-list-item>
          <igc-list-item>
            <igc-avatar slot="start" src={listSecond}></igc-avatar>
            <h4 slot="title">The Paradise Edition</h4>
            <span slot="subtitle">Lana Del Rey</span>
            <span slot="end">3.26</span>
            <igc-icon-button
              slot="end"
              name="more"
              aria-label={t({
                id: 'previewComponents.actions.more',
                message: 'More options',
              })}
            ></igc-icon-button>
          </igc-list-item>
          <igc-list-item>
            <igc-avatar slot="start" src={listThird}></igc-avatar>
            <h4 slot="title">Brooklyn Baby</h4>
            <span slot="subtitle">Lana Del Rey</span>
            <span slot="end">5.23</span>
            <igc-icon-button
              slot="end"
              name="more"
              aria-label={t({
                id: 'previewComponents.actions.more',
                message: 'More options',
              })}
            ></igc-icon-button>
          </igc-list-item>
        </igc-list>
      </div>

      <div className="preview__card--horizontal it-hover-border">
        <igc-card>
          <igc-card-header>
            <img
              width={169}
              height={112}
              src={musicCard}
              slot="thumbnail"
              alt={t({
                id: 'previewComponents.musicCard.imageAlt',
                message: 'Music thumbnail',
              })}
            />
            <h4 slot="title">
              One of These <br /> Mornings
            </h4>
            <h5 slot="subtitle">Moby</h5>
            <igc-icon-button
              slot="subtitle"
              name="check"
              aria-label={t({
                id: 'previewComponents.actions.verified',
                message: 'Verified',
              })}
            ></igc-icon-button>
          </igc-card-header>

          <igc-card-content>
            <span>3:41</span>
            <igc-linear-progress hide-label value="60"></igc-linear-progress>
            <span>5:00</span>
          </igc-card-content>
          <igc-card-actions>
            <igc-icon name="shuffle"></igc-icon>
            <igc-icon name="back"></igc-icon>
            <igc-icon name="play"></igc-icon>
            <igc-icon name="forward"></igc-icon>
            <igc-icon name="repeat"></igc-icon>
          </igc-card-actions>
        </igc-card>
      </div>

      <div className="preview__calendar it-hover-border">
        <igc-calendar
          id="calendar1"
          show-week-numbers
          week-start="monday"
          className="it-hover-border"
        ></igc-calendar>
      </div>

      <div className="preview__tabs it-hover-border">
        <igc-tabs alignment="start">
          <igc-tab>
            <div slot="label">
              <Translate id="previewComponents.tabs.podcasts">
                PODCASTS
              </Translate>
            </div>
          </igc-tab>
          <igc-tab>
            <div slot="label">
              <Translate id="previewComponents.tabs.charts">CHARTS</Translate>
            </div>
          </igc-tab>
          <igc-tab>
            <div slot="label">
              <Translate id="previewComponents.tabs.genres">GENRES</Translate>
            </div>
          </igc-tab>
          <igc-tab>
            <div slot="label">
              <Translate id="previewComponents.tabs.albums">ALBUMS</Translate>
            </div>
          </igc-tab>
          <igc-tab>
            <div slot="label">
              <Translate id="previewComponents.tabs.custom">CUSTOM</Translate>
            </div>
          </igc-tab>
        </igc-tabs>
      </div>

      <div className="preview__card--vertical it-hover-border">
        <igc-card>
          <igc-card-media>
            <img
              src={cardImage}
              height={204}
              alt={t({
                id: 'previewComponents.spaceCard.imageAlt',
                message: 'Astronaut',
              })}
            />
          </igc-card-media>

          <div className="preview__card-content--vertical">
            <igc-card-header>
              <h3 slot="title">
                <Translate id="previewComponents.spaceCard.title">
                  Lunar Horizon Habitat
                </Translate>
              </h3>
              <p slot="subtitle" className="preview__card-subtitle">
                <Translate id="previewComponents.spaceCard.subtitle">
                  Premium Explorer
                </Translate>
              </p>
            </igc-card-header>

            <igc-card-content>
              <p>
                <Translate id="previewComponents.spaceCard.description">
                  Enjoy a calm lunar retreat stay with Earth-rise views and
                  low-gravity comfort.
                </Translate>
              </p>
            </igc-card-content>

            <igc-card-actions>
              <div slot="start">
                <igc-icon-button
                  name="heart"
                  aria-label={t({
                    id: 'previewComponents.actions.favorite',
                    message: 'Add to favorites',
                  })}
                ></igc-icon-button>
              </div>
              <igc-button slot="end" variant="contained">
                <Translate id="previewComponents.spaceCard.bookNow">
                  Book now
                </Translate>
                <igc-icon slot="suffix" name="arrow"></igc-icon>
              </igc-button>
            </igc-card-actions>
          </div>
        </igc-card>
      </div>
    </div>
    </LocaleProvider>
  );
}
