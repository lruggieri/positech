### Considerations
A side panel that allows user to write a new echo.
* A user can be logged in or Anonymous
* Users can write up to 10 Echo a day
  * Anon users are detected by session-id (cookie). If none is available, use IP

Echos have to be filtered. Spam, vulgarity, length. Strictly positive unambiguous short messages.
* LLM to do this
  * On the flight? Easy, immediate, but expensive (token reached quickly)
  * Batched. More code, response not immediate (what do we say to the user?)

Maybe we can initially use an LLM on the fight. If the service starts to keep traction, we might need to change approach.

### Picker
How do we pick messages to be displayed?

#### Assumptions
1. If we limit each message to have 100 characters or 150 bytes, whatever comes first, than we would have that even 10M messages
would only require 1.5GB of memory

An in-memory solution seems pretty decent for this data size.

#### Random multi-cached picker
How it works:
* use Redis to store each message with `SADD {set-name} {message}`
* random limited retrieval with `SRANDMEMBER {set-name} {N}`
* can also store JSON as string like `'{"msg":"A message","usr":"user@gmail.com"}'` (might increase the space required a bit, but well within limits)