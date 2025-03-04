.data
hello:
    .ascii "Hello from Assembler!\n"

len = . - hello

.text
.global _start

_start:
    mov x0, 1          // file descriptor: stdout
    ldr x1, =hello    // pointer to message
    ldr x2, =len      // message length
    mov x8, 64        // syscall: write
    svc 0            // make syscall

    mov x0, 0         // status: 0
    mov x8, 93        // syscall: exit
    svc 0            // make syscall
