import { html } from '@polymer/lit-element';

// In this file we define our css inside a style tag and export it.
export const feedStyle = html`
  <style>
   .card{
    --card-padding: 16px;
    --card-height: 89px;
    --card-skeleton: linear-gradient(white var(--card-height), transparent 0);

    --upcoming-height: 14px;
    --upcoming-width: 60px;
    --upcoming-position: 5px 5px;
    --upcoming-skeleton: linear-gradient(#f2f2f2 var(--upcoming-height), transparent 0);

    --title-height: 18px;
    --title-width: 120px;
    --title-position: 5px 28px;
    --title-skeleton: linear-gradient(#f2f2f2 var(--title-height), transparent 0);

    --divider-height: 1px;
    --divider-width: calc(100% - var(--card-padding));
    --divider-position: 5px 60px;
    --divider-skeleton: linear-gradient(#f2f2f2 var(--divider-height), transparent 0);

    --details-height: 14px;
    --details-width: calc(100% - var(--card-padding));
    --details-position: 5px 70px;
    --details-skeleton: linear-gradient(#f2f2f2 var(--details-height), transparent 0);
    }

  .card.feed-item.skeleton{
      height: var(--card-height);
   }
  .card:empty::after{
      content: "";
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 5px;
      background-image:
          var(--upcoming-skeleton),
          var(--title-skeleton),
          var(--divider-skeleton),
          var(--details-skeleton),
          var(--card-skeleton)        /* card */
      ;
      background-size:
          var(--upcoming-width) var(--upcoming-height),
          var(--title-width) var(--title-height),
          var(--divider-width) var(--divider-height),
          var(--details-width) var(--details-height),
          100% 100%;
      ;
      background-position:
          var(--upcoming-position),
          var(--title-position),
          var(--divider-position),
          var(--details-position),
          0 0;                      /* card */
      ;
      background-repeat: no-repeat;
  }
  p {
      margin: 0;
  }

  .date-written {
      margin-bottom: 2px;
      font-size: 10pt;
  }

  .serie-name {
      color: #B71C1C;
      font-weight: 600;
      font-size: 13pt;
      margin-top: 5px;
      margin-bottom: 5px;
  }

  .row {
      float: left;
      margin-top: 10px;
      float: left;
      width: 100%;
  }

  .row p {
      float: left;
      color: #585858;
      margin-top: -3.5px;
  }

  .row div {
      height: 18px;
      float: left;
      width: 33%;
      display: flex
  }

  .row div:nth-child(2) {
      justify-content: center;
  }

  .row div:last-child p {
      width: 100%;
      text-align: right;
  }

  .divider {
      float: left;
      margin-top: 5px;
      float: left;
      width: 100%;
      height: 1px;
      background-color: #f2f2f2;
  }

  .row .se {
      color: #a2a2a2;
  }

  .icon-clock {
      margin-top: 3px;
  }

  #popup {
      border-radius: 5px;
      position: fixed;
      padding: 10px;
      width: calc(90% - 20px);
      left: calc(5%);
      bottom: 15px;
      color: white;
  }

  .fadeout {
      opacity: 0;
      transition: all 0.4s ease-out;
  }


  .card {
      float: left;
      width: calc(100% - 52px);
      margin-bottom: 10px;
      margin-top: 10px;
      overflow: hidden;

      /* CSS Animation smoothing hacks */
      -webkit-transform: translateZ(0);
    -moz-transform: translateZ(0);
    -ms-transform: translateZ(0);
    -o-transform: translateZ(0);
    transform: translateZ(0);

    -webkit-backface-visibility: hidden;
    -moz-backface-visibility: hidden;
    -ms-backface-visibility: hidden;
    backface-visibility: hidden;

    -webkit-perspective: 1000;
    -moz-perspective: 1000;
    -ms-perspective: 1000;
    perspective: 1000;
  }

  .card.open > .header-img{
      height: 200px;
  }
  .card.open > .description p{
      font-size: 14px;
      opacity: 1;
      transition: font-size 200ms 0ms ease-in, opacity 200ms 200ms ease-in;
  }
  .card.open > .description .add-calendar mwc-icon{
      font-size: 13pt !important;
      opacity: 1;
      transition: font-size 200ms 0ms ease-in, opacity 200ms 200ms ease-in;
  }
  .card.open > .description > .episode-title{
      margin-bottom: 10px;
      margin-top: 20px;
      transition: font-size 200ms 0ms ease-in, opacity 200ms 200ms ease-in, margin 200ms 0ms ease-in;
  }
  .card.open > .description > .add-calendar{
      margin-bottom: 10px;
      margin-top: 20px;
      padding: 10px;
      height: 20px;
      transition: font-size 200ms 0ms ease-in, height 200ms 0ms ease-in, opacity 200ms 200ms ease-in, margin 200ms 0ms ease-in, padding 200ms 0ms ease-in;
  }
  .header-img {
      transition: all 400ms ease-in-out;
      height: 0;
      float: left;
      width: calc(100% + 32px);
      margin-right: -16px;
      margin-left: -16px;
      margin-top: -16px;
      overflow: hidden;
      will-change: height;
  }

  .header-img img {
      width: 100%;
      height: 200px;
      object-fit: cover;
  }

  .description{
      float: left;
      width: 100%;
  }

  .description p{
      font-size: 0;
      opacity: 0;
      transition: font-size 200ms 200ms ease-in, opacity 200ms 0ms ease-in;
      will-change: font-size, opacity;
  }
  .description .add-calendar mwc-icon{
      font-size: 0 !important;
      opacity: 0;
      color: #5e5e5e;
      transition: font-size 200ms 200ms ease-in, opacity 200ms 0ms ease-in;
      will-change: font-size, opacity;
      float: left;
  }

  .card > .description > .episode-title {
      color: #1e1e1e;
      font-weight: 600;
      margin: inherit;
      transition: font-size 200ms 200ms ease-in, opacity 200ms 0ms ease-in, margin 200ms 200ms ease-in;
      will-change: font-size, opacity, margin;
  }
  .card > .description > .add-calendar {
      width: calc(100% - 20px);
      float: left;
      color: #828282;
      background-color: #eeeeee;
      margin: inherit;
      height: 0;
      padding: 0;
      transition: font-size 200ms 200ms ease-in, height 200ms 200ms ease-in, opacity 200ms 0ms ease-in, margin 200ms 200ms ease-in, padding 200ms 200ms ease-in;
      will-change: font-size, opacity, margin, padding;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
  }
  .card > .description > .add-calendar p{
      float: left;
      margin-top: -1px;
  }

  .basic-info {
      margin-top: 10px;
      float: left;
      width: 100%;
  }

  .floating-btn {
      position: fixed;
      background-color: #b71c1c;
      border-radius: 50%;
      height: 60px;
      width: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 2px 2px 20px rgba(0, 0, 0, 0.4);
  }

  #add-btn {
      right: 25px;
      bottom: 25px;
      transition: opacity 100ms ease-in-out;
      opacity: 1;
  }

  #add-btn.closed {
      opacity: 0;
  }

  .floating-btn i {
      color: white;
  }

  mwc-icon {
      font-size: 13pt !important;
      margin-right: 5px;
  }

  mwc-icon.arrow_back {
      font-size: 15pt !important;
      margin: 0;
      color: white;
  }

  #cards-container {
      float: left;
      width: 100%;
      margin-top: 15px;
  }

  .error-container {
      width: 100%;
      height: calc(100vh - 100px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
  }

  .error-container mwc-icon {
      font-size: 60pt !important;
      color: #d8d8d8;
  }
  </style>
`;