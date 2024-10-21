import { Component, Modal, Icon } from '../ui';

const Help = function Help(options = {}) {
  const {
    icon = '#ic_help_outline_24px',
    title = 'Hjälp',
    controlList
  } = options;
  const cls = 'o-help';
  const contentItems = [];
  const defaultOptions = {
    Guider: {
      text: '',
      icon: ''
    },
    About: {
      text: 'Här finner du mer information om kartan',
      icon: '#ic_info_outline_24px'
    },
    Draw: {
      text: 'Ritaverktyg, lägg till tillfälliga punkter, linjer, ytor eller texter. Glöm inte att spara filen eller skriva ut till pdf/bild om det ska behållas',
      icon: '#fa-pencil',
      url: ''
    },
    ZoomIn: {
      text: 'Zooma in i kartan',
      icon: '#ic_add_24px'
    },
    ZoomOut: {
      text: 'Zooma ut i kartan',
      icon: '#ic_remove_24px'
    },
    Help: {
      text: 'Hjälper dig att hitta hit',
      icon: '#ic_help_outline_24px'
    },
    Home: {
      text: 'Tar kartan till startposition',
      icon: '#ic_home_24px'
    },
    Geoposition: {
      text: 'Tar kartan till din position',
      icon: '#ic_near_me_24px'
    },
    Measure: {
      text: 'Mät avstånd och ytor',
      icon: '#ic_straighten_24px'
    },
    Mapmenu: {
      text: 'I menyn hittar du fler verktyg',
      icon: '#ic_menu_24px'
    },
    Sharemap: {
      text: 'Dela din karta med en kompis!',
      icon: '#ic_screen_share_outline_24px'
    },
    Print: {
      text: 'Skriv ut kartan till en pdf',
      icon: '#ic_print_24px'
    },
    Link: {
      text: 'Tar dig till en annan sida',
      icon: '#ic_launch_24px'
    },
    Draganddrop: {
      text: 'Du har möjlighet att dra in lager från din dator till kartan. Möjliga format är: GPX, GeoJSON, IGC, KML och TopoJSON',
      icon: ''
    },
    Editor: {
      text: 'Öppnar redigeringsverktyget',
      icon: '#fa-pencil-ruler'
    },
    Fullscreen: {
      text: 'Öppnar kartan i helskärmsläge',
      icon: '#ic_fullscreen_24px'
    },
    Legend: {
      text: 'Innehållsförteckning och teckenförklaring - visa eller dölj kartlager, klicka på rubriker och kartlager för information, ändra lagers genomskinlighet mm',
      icon: '#ic_layers_24px'
    },
    Position: {
      text: 'Klicka på denna om du vill ha positionen från kartans centrum och kan definiera egna koordinater direkt i koordinattexten. Byt system genom att klicka på koordinatsystemet',
      icon: '#ic_gps_not_fixed_24px'
    },
    Progressbar: {
      text: 'Den blå linjen i nedre delan av kartan visar på hämtning av information',
      icon: ''
    },
    Rotate: {
      text: 'Rotera kartan med två fingrar på pekskärm, håll ned Shift+Alt på PC. Klicka på symbolen för att återgå',
      icon: '#origo-compass'
    },
    Scale: {
      text: '',
      icon: ''
    },
    Scaleline: {
      text: '',
      icon: ''
    },
    Search: {
      text: 'Sök i kartan',
      icon: '#ic_search_24px'
    },
    Splash: {
      text: '',
      icon: ''
    },
    Externalurl: {
      text: 'Öppnar fler knappar där du kan välja att öppna din kartposition i annan applikation',
      icon: '#ic_baseline_link_24px'
    },
    Scalepicker: {
      text: 'Visar kartans nuvarande skala. Klicka för att välja skala manuellt',
      icon: ''
    },
    Multiselect: {
      text: 'Markera flera objekt genom att rita cirkel, rektangel, polygon eller buffert runt ett objekt',
      icon: '#baseline-select-all-24px'
    },
    Estatelookup: {
      text: 'Visa fastighet genom att klicka i kartan',
      icon: '#ic_crop_house_24px'
    },
    Download: {
      text: 'Hämta data till fil, tänd först lager i Nedladdningsbara lager och zooma till önskad utbredning',
      icon: '#ic_get_app_24px'
    },
    Legendvisiblelayers: {
      text: 'Minimera legenden/lagerlistan så den bara visar tända lager',
      icon: '#ic_close_fullscreen_24px'
    }
  };

  const modalContent = () => {
    controlList.forEach((el) => {
      let textEl = el.text || defaultOptions[el.name].text;
      const iconEl = el.icon || defaultOptions[el.name].icon;
      const urlEl = el.url || defaultOptions[el.name].url;
      const iconStyle = el.iconStyle || '';
      const controlIcons = Icon({
        icon: iconEl,
        style: iconStyle
      });
      if (urlEl) {
        textEl = `<a href="${urlEl}" target="_blank">${textEl}</a>`;
      }
      const list = `<li class="flex ${cls}"><span class="flex icon icon-medium padding-x-large">${controlIcons.render()}</span>${textEl}</li>`;

      contentItems.push(list);
    });
  };

  let { buttonText, target } = options;
  let viewer;
  let mapMenu;
  let menuItem;
  let modal;

  return Component({
    name: 'help',
    onAdd(evt) {
      if (!buttonText) buttonText = title;
      viewer = evt.target;
      target = viewer.getId();
      mapMenu = viewer.getControlByName('mapmenu');
      modalContent();
      menuItem = mapMenu.MenuItem({
        click() {
          modal = Modal({
            title,
            content: contentItems.join(' '),
            target
          });
          this.addComponent(modal);
          mapMenu.close();
        },
        icon,
        title: buttonText
      });
      this.addComponent(menuItem);
      this.render();
    },
    render() {
      mapMenu.appendMenuItem(menuItem);
      this.dispatch('render');
    }
  });
};

export default Help;
