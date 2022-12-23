# TableGame
- For table oriented games... with ERC20 compitible token deposit.
- All contracts code is in this one file [here](./contracts/TableGame.sol).


# 代币合约游戏
- 使用ERC20兼容的代币作为质押货币来管理的游戏合约。
- 所有的合约代码在这一个[文件](./contracts/TableGame.sol)里面。

## 主合约：TableGameFactory
> 主合约只需要部署一次，用来创建所有的合约游戏的代币质押session，部署主合约的账户地址为主合约以及所有游戏合约的所有者owner。部署时需提供beneficiary作为每一个合约游戏的最终分成收益人，请尽量使用一个冷钱包。

### 部署接口定义：

| 字段  | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| beneficiary | address | 当游戏结束的时候的抽成会发送到这个地址，常为一个冷钱包地址。 |

### 可调用接口定义：
#### **createTableGame**
- 接口各字段说明：

| 字段  | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| tokenAddress | address | ERC20兼容的代币合约地址。 |
| hoursToCloseGame | uint | 游戏session的时长（从代理加入时开始计算），超过这个时间会停止所有游戏的加入操作。 |

- 返回值：

| 类型 | 说明 |
| ------------- | ------------- |
| address | 合约游戏实际地址。 |

- 可触发事件：TableGameCreated

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| tableAddress | address | 合约游戏实际地址。 |
| creatorAddress | address | 游戏创建者地址。 |

#### **createTableGameUSDTOnETH，createTableGameUSDCOnGoerli，createTableGameUSDTOnBSC，createTableGameUSDTOnBSCTestnet**
- 接口各字段说明：

| 字段  | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| hoursToCloseGame | uint | 游戏session的时长（从代理加入时开始计算），超过这个时间会停止所有游戏的加入操作。 |

- 返回值：

| 类型 | 说明 |
| ------------- | ------------- |
| address | 使用USDT为代币且运行于ETH，Goerli，BSC，BSCTestnet区块链上的合约游戏实际地址。 |

- 可触发事件：TableGameCreated

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| tableAddress | address | 合约游戏实际地址。 |
| creatorAddress | address | 游戏创建者地址。 |

## 游戏合约：TableGame
> 游戏合约用以管理一个游戏session，作为游戏的代理（host），玩家（player）可以加入或者退出游戏并获得需要结算的代币数额。游戏的所有者owner也是主合约的所有者（部署主合约所用地址）会用作签名验证用以保证游戏合约的接口调用只能来自于owner端。

### 部署接口定义：

| 字段  | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| tokenAddress | address | ERC20兼容的代币合约地址。 |
| owner | address | 游戏合约的所有者owner地址，也是主合约的所有者。 |
| beneficiary | address | 当游戏结束的时候的抽成会发送到这个地址，常为一个冷钱包地址。 |
| hoursToCloseGame | uint | 游戏session的时长（从代理加入时开始计算），超过这个时间会停止所有游戏的加入操作。 |

### 可调用接口定义：
#### **joinTableWithDepositAsHost，joinTableWithDepositAsPlayer**
> 加入游戏并成为代理（host）或者玩家（player）且质押一定的代币，每个游戏只可以有一个代理，可以有多个玩家。玩家和代理都可多次调用加入接口从而增加质押代币数额。当有游戏时长（从代理加入时开始计算）超过hoursToCloseGame时，这两个接口会调用失败。

- 接口各字段说明：

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| _amount | uint256 | ERC20兼容的代币质押数额。 |
| _signature | bytes | 经过owner签名的接口调用验证信息。 |

- 可触发事件：HostJoined，PlayerJoined

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| host, player | address | 加入游戏的参与者地址。 |
| amount | uint256 | 代币质押数额。 |

- 可触发事件：ServerHashValidationFailurePlayer

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| table | address | 游戏合约地址。 |
| player | address | 加入游戏的参与者地址（可以是host或者player）。 |
| amount | uint256 | 代币质押数额。 |
| action | string | 调用接口类型（joinTableWithDeposit）。 |
| serverHash | bytes | 外部传入的签名原始信息。 |

#### **checkOutWithSettlementAsHost**
> 作为代理（host）退出游戏并结算。

- 接口各字段说明：

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| _amount | uint256 | 结算给代理的代币数额。 |
| _profit | uint256 | 分成结算给beneficiary的代币数额。 |
| _signature | bytes | 经过owner签名的接口调用验证信息。 |

- 可触发事件：HostCheckedOut

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| host | address | 加入游戏的代理地址。 |
| amount | uint256 | 结算给代理的代币数额。 |
| profit | uint256 | 分成给beneficiary的代币数额。 |

- 可触发事件：TableClosed

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| table | address | 游戏合约的地址。 |
| owner | address | 游戏合约所有者的地址。 |
| amount | uint256 | 游戏合约剩余代币数额。 |

- 可触发事件：ServerHashValidationFailureHost

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| table | address | 游戏合约地址。 |
| host | address | 加入游戏的代理（host）的地址。 |
| amount | uint | 结算给代理的代币数额。 |
| profit | uint | 分成结算给beneficiary的代币数额。 |
| action | uint | 调用接口类型（checkOutWithSettlement）。 |
| serverHash | uint | 外部传入的签名原始信息。 |

#### **checkOutWithSettlementAsPlayer**
> 作为玩家（player）退出游戏并结算。

- 接口各字段说明：

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| _amount | uint256 | 结算给玩家的代币数额。 |
| _signature | bytes | 经过owner签名的接口调用验证信息。 |

- 可触发事件：PlayerCheckedOut

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| player | address | 加入游戏的玩家地址。 |
| amount | uint256 | 结算给玩家的代币数额。 |

- 可触发事件：TableClosed

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| table | address | 游戏合约的地址。 |
| owner | address | 游戏合约所有者的地址。 |
| amount | uint256 | 游戏合约剩余代币数额。 |

- 可触发事件：ServerHashValidationFailurePlayer

| 字段 | 类型 | 说明 |
| ------------- | ------------- | ------------- |
| table | address | 游戏合约地址。 |
| player | address | 加入游戏的玩家（player）的地址。 |
| amount | uint | 代币质押数额。 |
| action | uint | 调用接口类型（checkOutWithSettlement）。 |
| serverHash | uint | 外部传入的签名原始信息。 |

#### **getAccumulatedBalance**
> 获取通过游戏合约接口加入游戏所累积的质押代币总数额。

- 返回值：

| 类型 | 说明 |
| ------------- | ------------- |
| uint256 | 游戏当前所累积的质押代币总数额。 |

#### **getContractBalance**
> 获取代币在当前游戏合约地址上的总数额（可能通过非游戏合约接口直接转账代币造成该结果大于等于getAccumulatedBalance）。

- 返回值：

| 类型 | 说明 |
| ------------- | ------------- |
| uint256 | 游戏合约地址上代币总数额。 |

#### **isTableReady**
> 游戏合约是否已经有代理（host）加入并有一定数额的质押代币。

- 返回值：

| 类型 | 说明 |
| ------------- | ------------- |
| bool | 游戏合约是否已经有代理加入并质押了一定代币。 |

## Bug历史记录：
- 无效的服务端签名验证触发的事件。
  - 删除了ServerHashValidationFailureHost事件，当检验发生错误的时候，合约会失败，并不会上链和触发事件，所有需要client端捕捉失败结果。
  - 修复在[这里](https://github.com/sumer-meso/TableGame/commit/b90a2ffef2ac491411f8444ecf390247359329e3)。

- 使用SafeERC20来处理所有的transfer。
  - 当对ERC20代币进行转账的时候，应该使用safeTransfer和safeTransferFrom，保证更好的安全性。
  - 修复在[这里](https://github.com/sumer-meso/TableGame/commit/b90a2ffef2ac491411f8444ecf390247359329e3)。
