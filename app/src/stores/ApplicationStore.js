// @flow

import {action, observable, computed} from 'mobx';
import React from 'react';

export default class ApplicationStore {
  @observable alertMessage: ?string;
  @observable alertType: ?string;
  @observable ethereumNodeConnected: boolean;
  @observable ipfsNodeConnected: boolean;
  @observable screen: string = 'StartScreen';

  @action
  alert(type: ?string, message: ?string) {
    this.alertMessage =  message;
    this.alertType = type;
  }

  alertError(error: Error) {
    this.alert('danger', error.message);
  }

  clearAlert() {
    this.alert(null, null);
  }
}
