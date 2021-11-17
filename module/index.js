
/**
 * A client for connecting to a Relay API service.
 */
export class RelayClient {

    constructor(options) {

        // Compile the options configuring the client
        this._options = {
            'apiEndpoint': 'wss://api.relay.ninja',
            'apiKey': '',
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

        // The amount of seconds to delay before trying to reconnect
        this._retryDelay = 0

        // Flag indicating we should unsubscribe (not attempt to reconnect) on
        // the next close event.
        this._unsubscribe = false
    }

    // -- Getters / Setters --

    get connected() {
        return this._socket !== null
    }

    // -- Public methods --

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
                    'user_id': userId,
                    'user_token': userToken
                }
            ]))

        } else {
            this._connect()
        }
    }

    /**
     * Unsubscribe from the subcription.
     */
    unsubscribe() {
        if (this.connected) {
            this._unsubscribe = true
            this._socket.addEventListener(
                'close',
                () => {
                    this._unsubscribe = false
                }
            )
            this._socket.close()
        }
    }

    // -- Private meothds --

    /**
     * Establish a websocket connection to the Relay API.
     */
    _connect() {
        this._socket = new WebSocket(this._options.apiEndpoint)

        this._socket.addEventListener(
            'open',
            () => {
                this._retryDelay = 0

                const {userId, userToken, channels} = this._authArgs
                this.auth(userId, userToken, channels)
            }
        )

        this._socket.addEventListener(
            'close',
            (event) => {
                this._socket = null

                if (this._unsubscribe) {
                    return
                }

                if (event.wasClean) {
                    this._connect()
                } else {
                    this._retryDelay = Math.min(
                        Math.max(this._retryDelay * 2, 1),
                        64
                    )
                    setTimeout(
                        () => {
                            this._connect()
                        },
                        this._retryDelay * 1000
                    )
                }
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
