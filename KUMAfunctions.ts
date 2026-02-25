import { WebSocketClient, RestAuthenticatedClient, KumaOrder, RestPublicClient, KumaCanceledOrder, KumaPosition } from '@kumabid/kuma-sdk'
import { v1 as uuid } from 'uuid'
import localeTexts from '../data/texts.json' with { type: 'json' }
import { UserData, Localization, Lang } from '../models/interfaces.js'
import { computeAddress } from 'ethers'
import { Bot } from 'grammy'
import { CTX } from '../models/types.js'


export default class Kuma {
    WS!: WebSocketClient
    REST!: RestAuthenticatedClient
    WSPublic!: WebSocketClient
    RESTPublic!: RestPublicClient
    private L!: Lang
    private SESSIONKEYADDRESS!: string
    private USERDATA!: UserData

    constructor(userData: UserData | undefined = undefined, sandbox: boolean = false) {
        this.RESTPublic = new RestPublicClient()
        this.WSPublic = new WebSocketClient()    
        if (userData) {
            this.USERDATA = userData
            this.L = (localeTexts as unknown as Localization)[userData.lang]
            const apiKey = this.USERDATA.apiKey
            const secretKey = this.USERDATA.apiSecret
            this.WS = new WebSocketClient({
                auth: {
                    apiKey: apiKey,
                    apiSecret: secretKey,
                    wallet: this.USERDATA.wallet,
                },
                sandbox: sandbox
            })
            this.SESSIONKEYADDRESS = computeAddress(this.USERDATA.sessionKey)
            this.REST = new RestAuthenticatedClient({
                apiKey: apiKey,
                apiSecret: secretKey,
                walletPrivateKey: this.USERDATA.sessionKey,
                sandbox: sandbox
            })
        }
    }

    public handleErrors(error: any): string {
        if (error.response?.data?.code) {
            switch (error.response.data.code) {
                case 'INVALID_PARAMETER': return this.L.errorParams     
                case 'INSUFFICIENT_FUNDS': return this.L.errorInsufficientFunds
                case 'LIMIT_PRICE_OUT_OF_BOUNDS': return this.L.errorPrice
                case 'QUANTITY_TOO_LOW': return this.L.errorQuantityLow
            }
        }
        return '❌ <b>ERROR</b>'
    }


    private parseDirection(posSide: 'long' | 'short', action: 'buy' | 'sell') {
        let side: 'sell' | 'buy'
        if (posSide === 'long') {
            side = action === 'sell' ? 'sell' : 'buy'
        }
        else {
            side = action === 'sell' ? 'buy' : 'sell'
        }
        return side 
    }

    public async walletData(): Promise<{balance: number, freeCollateral: number, usedBalance: number}> {
        try {
            const walletData = (await this.REST.getWallets({ nonce: uuid(), wallet: this.USERDATA.wallet }))[0]
            const balance = Number(walletData.equity)
            const freeCollateral = Number(walletData.availableCollateral)
            const onOrders = Number(walletData.heldCollateral)
            const usedBalance = (balance - Number(walletData.freeCollateral)) + onOrders
            return { balance, freeCollateral, usedBalance }
        } catch (error) {
            console.error('Error fetching wallet data:', error)
            throw error
        }
    }

    public calculateQuantity(currentPrice: number, usdToBuy: number): number{
        return usdToBuy / currentPrice
    }
    
    private parseQuantity(ticker: string, quantity: number): string {
        switch (ticker) {
            case 'BTC-USD': return quantity.toFixed(4) + '0000'
            case 'ETH-USD': return quantity.toFixed(3) + '00000'
            case 'XRP-USD': return quantity.toFixed(1) + '0000000'
            case 'SOL-USD': return quantity.toFixed(1) + '0000000'
            case 'BERA-USD': return quantity.toFixed(1) + '0000000'
            case 'FARTCOIN-USD': return quantity.toFixed(1) + '0000000'
            case 'LINK-USD': return quantity.toFixed(1) + '0000000'
            case 'ARB-USD': return quantity.toFixed(1) + '0000000'
            case 'ENA-USD': return quantity.toFixed(0) + '.00000000'
            case 'SEI-USD': return quantity.toFixed(0) + '.00000000'
            case 'DOGE-USD': return quantity.toFixed(1) + '0000000'
            case 'PENGU-USD': return quantity.toFixed(0) + '.00000000'
            case 'PUMP-USD': return quantity.toFixed(0) + '.00000000'
            case 'BNB-USD': return quantity.toFixed(1) + '0000000'
            case 'SUI-USD': return quantity.toFixed(1) + '0000000'
            case 'SPX-USD': return quantity.toFixed(0) + '.00000000'
            case 'POPCAT-USD': return quantity.toFixed(0) + '.00000000'
            case 'TRUMP-USD': return quantity.toFixed(1) + '0000000'
            case 'LTC-USD': return quantity.toFixed(2) + '000000'
            case 'AAVE-USD': return quantity.toFixed(1) + '0000000'
            case 'TIA-USD': return quantity.toFixed(1) + '0000000'
            case 'LDO-USD': return quantity.toFixed(1) + '0000000'
            case 'AVAX-USD': return quantity.toFixed(1) + '0000000'
            case 'WIF-USD': return quantity.toFixed(0) + '.00000000'
            case 'WLD-USD': return quantity.toFixed(1) + '0000000'
            case '1000PEPE-USD': return quantity.toFixed(0) + '.00000000'
            case 'ETHFI-USD': return quantity.toFixed(1) + '0000000'
            case 'CRV-USD': return quantity.toFixed(0) + '.00000000'
            case 'ADA-USD': return quantity.toFixed(0) + '.00000000'
            default: throw new Error('Invalid ticker')
        }
    }

    private parsePrice(ticker: string, price: number): string {
        switch (ticker) {
            case 'BTC-USD': return price.toFixed(8).replace(/\..*$/, '.00000000')
            case 'ETH-USD': return price.toFixed(1) + '0000000'
            case 'XRP-USD': return price.toFixed(2) + '000000'
            case 'SOL-USD': return price.toFixed(2) + '000000'
            case 'BERA-USD': return price.toFixed(2) + '000000'
            case 'FARTCOIN-USD': return price.toFixed(2) + '000000'
            case 'LINK-USD': return price.toFixed(2) + '000000'
            case 'ARB-USD': return price.toFixed(2) + '000000'
            case 'ENA-USD': return price.toFixed(2) + '000000'
            case 'SEI-USD': return price.toFixed(2) + '000000'
            case 'DOGE-USD': return price.toFixed(2) + '000000'
            case 'PENGU-USD': return price.toFixed(2) + '000000'
            case 'PUMP-USD': return price.toFixed(6) + '00'
            case 'BNB-USD': return price.toFixed(2) + '000000'
            case 'SUI-USD': return price.toFixed(2) + '000000'
            case 'SPX-USD': return price.toFixed(2) + '000000'
            case 'POPCAT-USD': return price.toFixed(2) + '000000'
            case 'TRUMP-USD': return price.toFixed(2) + '000000'
            case 'LTC-USD': return price.toFixed(0) + '.00000000'
            case 'AAVE-USD': return price.toFixed(2) + '000000'
            case 'TIA-USD': return price.toFixed(2) + '000000'
            case 'LDO-USD': return price.toFixed(2) + '000000'
            case 'AVAX-USD': return price.toFixed(2) + '000000'
            case 'WIF-USD': return price.toFixed(2) + '000000'
            case 'WLD-USD': return price.toFixed(2) + '000000'
            case '1000PEPE-USD': return price.toFixed(6) + '00'
            case 'ETHFI-USD': return price.toFixed(2) + '000000'
            case 'CRV-USD': return price.toFixed(2) + '000000'
            case 'ADA-USD': return price.toFixed(2) + '000000'
            default: throw new Error('Invalid ticker')
        }
    }

    public tickerParser(ticker: string) {
        return (ticker.endsWith('USDT') ? ticker.replace('-USDT', '-USD') : ticker)
    }

    public async limitOrder(
        ticker: string,
        posSide: 'long' | 'short',
        action: 'sell' | 'buy',
        tokenQuantity: number,
        price: number)
        : Promise<KumaOrder | undefined> {
        try {
            return await this.REST.createOrder({
                type: 'limit',
                price: this.parsePrice(ticker, price),
                side: this.parseDirection(posSide, action),
                nonce: uuid(),
                wallet: this.USERDATA.wallet,
                market: ticker,
                quantity: this.parseQuantity(ticker, tokenQuantity),
                delegatedKey: this.SESSIONKEYADDRESS,
                reduceOnly: action === 'sell' ? true : false
            })
        } catch (error) {
            throw error
        }
    }

    public async marketOrder(
        ticker: string,
        posSide: 'long' | 'short',
        action: 'sell' | 'buy',
        tokenQuantity: number)
        : Promise<KumaOrder | undefined> {
        try {
            return await this.REST.createOrder({
                type: 'market',
                side: this.parseDirection(posSide, action),
                nonce: uuid(),
                wallet: this.USERDATA.wallet,
                market: ticker,
            quantity: this.parseQuantity(ticker, tokenQuantity),
            delegatedKey: this.SESSIONKEYADDRESS
        })
    } catch (error) {
        throw error
    }
    }
    public async stopOrder(
        ticker: string,
        posSide: 'long' | 'short',
        action: 'sell' | 'buy',
        tokenQuantity: number,
        price: number)
        : Promise<KumaOrder | undefined> {
        try {
            const priceParsed = this.parsePrice(ticker, price) 
            return await this.REST.createOrder({
                type: 'stopLossMarket',
                triggerPrice: priceParsed,
                triggerType: 'last',
                side: this.parseDirection(posSide, action),
                nonce: uuid(),
                wallet: this.USERDATA.wallet,
                market: ticker,
                quantity: this.parseQuantity(ticker, tokenQuantity),
                delegatedKey: this.SESSIONKEYADDRESS,
                reduceOnly: action == 'sell' ? true : false
        })
    } catch (error) {
        throw error
    }
    }

    public async setLeverage(ticker: string, leverage: number) {
        const leverageFraction = (1 / leverage).toFixed(2) + '000000'      
        return await this.REST.setInitialMarginFractionOverride({
            market: ticker,
            nonce: uuid(),
            wallet: this.USERDATA.wallet,
            initialMarginFractionOverride: leverageFraction,
            delegatedKey: this.SESSIONKEYADDRESS
    })
    }

    public async getLeverage(ticker: string) {
        const leverageFraction = await this.REST.getInitialMarginFractionOverride({
            market: ticker,
            nonce: uuid(),
            wallet: this.USERDATA.wallet,
        })
        try {
            const fraction = Number(leverageFraction[0].initialMarginFractionOverride)
            if (fraction == 0) return 20
            return 1 / fraction
        } catch (error) {
            console.error('ERROR GETTING LEVERAGE: ' + error)
        }
    }

    public async cancelOrders(ticker: string): Promise<KumaCanceledOrder[] | undefined> {
        try {
            return await this.REST.cancelOrders({
                nonce: uuid(),
                wallet: this.USERDATA.wallet,
                market: ticker,
                delegatedKey: this.SESSIONKEYADDRESS
            })
        } catch (error) {
            console.error('ERROR CANCELLING ORDERS: ' + error)
        }
    }

    public async cancelOrdersByIDs(orderIDs: string[]): Promise<KumaCanceledOrder[] | undefined> {
        try {
            return await this.REST.cancelOrders({
                nonce: uuid(),
                wallet: this.USERDATA.wallet,
                orderIds: orderIDs,
                delegatedKey: this.SESSIONKEYADDRESS
            })
        } catch (error) {
            console.error('ERROR CANCELLING ORDERS: ' + error)
        }
    }

    public async getPosition(ticker: string | undefined): Promise<KumaPosition> {
        const position = (await this.REST.getPositions({
            nonce: uuid(),
            wallet: this.USERDATA.wallet,
            market: ticker,
        }))[0]
        return position
    }

    public async getAllPositions(): Promise<KumaPosition[] | undefined> {
        const positions = await this.REST.getPositions({
            nonce: uuid(),
            wallet: this.USERDATA.wallet,
        })
        if (positions.length !== 0) {
            return positions
        }
    }

    public async getOrders(ticker: string | undefined) {
        const tickerObj = ticker ? { market: ticker } : {}
        return await this.REST.getOrders({
            nonce: uuid(),
            wallet: this.USERDATA.wallet,
            ...tickerObj,
        })
    }

    private async wait(seconds: number) {
        await new Promise(resolve => setTimeout(resolve, seconds * 1000))
    }

    public async watch(Telegram: Bot<CTX>) {
        await this.WS.connect(true)
        await this.WS.subscribeAuthenticated([{ name: 'orders' }, { name: 'positions' }])
        try {
            this.WS.onMessage(async (res) => {
                switch (res.type) {
                    case 'orders': {
                        const D = res.data
                        if (D.fills && D.fills.length > 0) {
                            for (const F of D.fills.values()) { 
                                const fee = F.fee ?? 'LIQUIDATION'
                                const orderMsg = `🟢 <b>#${D.market.replace('-', '')}</b> 🟢\n\n` + this.L.orderFilled
                                    .replace('%a', Number(F.quoteQuantity).toFixed(2))
                                    .replace('%pd', F.position)
                                    .replace('%a', F.action)
                                    .replace('%f', fee)
                                await Telegram.api.sendMessage(this.USERDATA.uid, orderMsg)             
                            }
                        }
                        break
                    }
                    case 'positions': {
                        const D = res.data
                        const direction = Number(D.quantity) > 0 ? 'long' : 'short'
                        if (D.status == 'closed') {
                            const pnl = Number(Number(D.realizedPnL).toFixed(1))
                            const pnlText = (pnl > 0 ? '🟢' :  '🔴') + ` <b>${pnl}</b>USD`
                            const posMsg = `🔵 <b>#${D.market.replace('-', '')}</b> 🔵\n` + this.L.closedPosition.replace('%pd', direction).replace('%ep', parseFloat(D.exitPrice).toString()).replace('%pnl', pnlText)
                            await Telegram.api.sendMessage(this.USERDATA.uid, posMsg)  
                        }  
                    }
                    default: return
                }    
            })
        } catch (error) {
            console.error(`WS WATCH UNEXPECTED ERROR ON USER ${this.USERDATA.firstName}: ${error}`)
        }
        
        this.WS.onDisconnect(async () => {
            console.error(`WS WATCH DISCONNECTED ON USER ${this.USERDATA.firstName}`)
            while (!this.WS.isConnected) {
                await this.wait(45)
                await this.WS.connect(true)
                await this.WS.subscribeAuthenticated([{ name: 'orders' }, { name: 'positions' }])
            }
            console.log(`WS WATCH RECONNECTED FOR USER ${this.USERDATA.firstName}`)
        })

        this.WS.onError(async (error) => {
            console.error(`WS WATCH ERROR ON USER ${this.USERDATA.firstName}: ${error}`)
        }) 
    }
}




