import { html } from '@polymer/lit-element';

// In this file we define our css inside a style tag and export it.
export const styles = html`
  <style>
    /* Regular css syntax */
    .card {
        margin: 10px;
        padding: 16px;
        color: #757575;
        border-radius: 5px;
        background-color: #fff;
        box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);
      }

      .circle {
        display: inline-block;
        width: 64px;
        height: 64px;
        text-align: center;
        color: #555;
        border-radius: 50%;
        background: #ddd;
        font-size: 30px;
        line-height: 64px;
      }

      h1 {
        margin-left: 10px;
        margin-bottom: 30px;
        margin-top: 30px;
        color: #212121;
        font-size: 20px;
      }
  </style>
`;