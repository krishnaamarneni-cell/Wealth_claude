"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Plus } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Benchmark {
  id: string
  name: string
  region: string
  description?: string
}

interface BenchmarkSelectorProps {
  availableBenchmarks: Benchmark[]
  selectedBenchmarks: string[]
  onBenchmarkToggle: (benchmarkId: string) => void
  maxSelections?: number
}

export function BenchmarkSelector({
  availableBenchmarks,
  selectedBenchmarks,
  onBenchmarkToggle,
  maxSelections = 4
}: BenchmarkSelectorProps) {
  const [open, setOpen] = useState(false)

  const canAddMore = selectedBenchmarks.length < maxSelections

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Compare with up to {maxSelections} benchmarks ({selectedBenchmarks.length} selected)
        </p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!canAddMore}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Benchmark
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" align="end">
            <Command>
              <CommandInput placeholder="Search benchmarks..." />
              <CommandEmpty>No benchmark found.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {availableBenchmarks
                  .filter(b => !selectedBenchmarks.includes(b.id))
                  .map((benchmark) => (
                    <CommandItem
                      key={benchmark.id}
                      onSelect={() => {
                        if (canAddMore) {
                          onBenchmarkToggle(benchmark.id)
                          setOpen(false)
                        }
                      }}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{benchmark.name}</span>
                        {benchmark.description && (
                          <span className="text-xs text-muted-foreground">
                            {benchmark.description}
                          </span>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {benchmark.region}
                      </Badge>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Benchmarks */}
      {selectedBenchmarks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedBenchmarks.map((benchmarkId) => {
            const benchmark = availableBenchmarks.find(b => b.id === benchmarkId)
            if (!benchmark) return null
            
            return (
              <Badge
                key={benchmarkId}
                variant="default"
                className="gap-2 py-2 px-3 text-sm"
              >
                <span>{benchmark.name}</span>
                <span className="text-xs opacity-70">({benchmark.region})</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                  onClick={() => onBenchmarkToggle(benchmarkId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
            No benchmarks selected. Click "Add Benchmark" to compare.
          </p>
        </div>
      )}
    </div>
  )
}
