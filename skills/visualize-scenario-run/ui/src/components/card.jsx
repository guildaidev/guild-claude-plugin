// shadcn/ui new-york Card, MIT; JavaScript port of the registry component.
import * as React from 'react';
import { cn } from '../utils.jsx';
const Card = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn('rounded-xl border bg-card text-card-foreground shadow', className)} {...props} />);
Card.displayName = 'Card';
export { Card };
