import {observable, computed} from 'mobx';
import React from 'react';

class ApplicationStore {
  @observable error;
  @observable ethereumNodeConnected;
  @observable ipfsNodeConnected;
  @observable screen = 'StartScreen';
  @observable resultsBracket = false;

  @computed get errorMessage() {
    if (this.error) {
      return this.error.message;
    }
  }
}

export default new ApplicationStore();
