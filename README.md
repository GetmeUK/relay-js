
A JS client for the relay service which relays server-side messages to client-side subscribers (e.g. browser) via websockets.

## Installation

`npm install relay-js --save-dev`


## Usage

```JavaScript
import {RelayClient} as $ from 'relay-js'

const client = RelayClient(
    'your_api_key...',
    {
        'on_message': (message) => {
            console.log(message)
        }
    }
)

client.auth(
    'burt',
    'your_user_session',
    'channels': ['global', ...]
)


```
