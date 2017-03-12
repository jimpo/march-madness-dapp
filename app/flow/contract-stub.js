type Input = {name: string, type: string};
type Output = {name: string, type: string};
type MethodSignature = {
  constant: boolean,
  inputs: Input[],
  name: string,
  outputs: Output[],
  payable: boolean,
  type: string
};
type ContractSpec = {
  abi: MethodSignature[],
  networks: {[id: string]: {address: string}}
};

export const contractSpec: ContractSpec = {};
