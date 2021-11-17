
/**
 * A client for connecting to a Relay API service.
 */
export class RelayClient {

    constructor(options) {

        // Compile the options configuring the client
        this._options = {
            'apiEndpoint': 'wss://api.relay.ninja',
            'apiKey': '',
            'autoReconnect': true,
            'onError': (error) => {
                console.error(error)
            },
            'onMessage': (message) => {
                console.log(message)
            }
        }
        Object.assign(this._options, options || {})

        // A copy of the last authorization call arguments used to support
        // auto-reconnect.
        this._authArgs = null

        // The websocket the client is connected to the API via
        this._socket = null
    }

    get connected() {
        return this._socket !== null
    }

    /**
     * Authorize a subscription for the given user and channels.
     */
    auth(userId, userToken, channels) {
        // Store the authorization arguments
        this._authArgs = {
            'channels': channels.slice(),
            userId,
            userToken
        }

        if (this.connected) {

            // Authorize the subscription
            this._socket.send(JSON.stringify([
                'auth',
                {
                    'api_key': this._options.apiKey,
                    channels,
                    userId,
                    userToken
                }
            ]))

        } else {
            this._connect()
        }
    }

    /**
     * Establish a websocket connection to the Relay API.
     */
    _connect() {
        this._socket = new WebSocket(this._options.apiEndpoint)

        this._socket.addEventListener(
            'open',
            () => {
                const {userId, userToken, channels} = this._authArgs
                this.auth(userId, userToken, channels)
            }
        )

        this._socket.addEventListener(
            'close',
            (event) => {
                this._socket = null
                console.log(event)
                // if (this._options.autoReconnect) {
                //     this._connect()
                // }
            }
        )

        this._socket.addEventListener(
            'message',
            (event) => {
                const header = event.data.substr(0, 1)
                const rawMessage = event.data.substr(1)
                if (header === '~') {
                    this._options.onError(JSON.parse(rawMessage))
                } else {
                    this._options.onMessage(rawMessage)
                }
            }
        )
    }
}
