// @flow

import {observable, computed} from 'mobx';
import React from 'react';

export default class ApplicationStore {
  @observable error: Error;
  @observable ethereumNodeConnected: boolean;
  @observable ipfsNodeConnected: boolean;
  @observable screen: string = 'StartScreen';

  @computed get errorMessage(): ?string {
    if (this.error) {
      return this.error.message;
    }
  }
}
